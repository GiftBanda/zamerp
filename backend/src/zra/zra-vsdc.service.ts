import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';

type ZraInvoiceItem = {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discountPercent?: string | number | null;
  vatAmount?: string | number | null;
  total: string | number;
  product?: {
    id?: string;
    sku?: string;
    name?: string;
  } | null;
};

type ZraInvoiceCustomer = {
  name?: string | null;
  tpin?: string | null;
};

type ZraInvoiceTenant = {
  name?: string | null;
};

export type ZraInvoicePayloadSource = {
  invoiceNumber: string;
  issueDate: Date | string;
  subtotal: string | number;
  vatAmount: string | number;
  total: string | number;
  customer?: ZraInvoiceCustomer | null;
  items: ZraInvoiceItem[];
  tenant?: ZraInvoiceTenant | null;
};

interface VsdcCodeDetail {
  cd: string;
  cdNm?: string;
  userDfnCd1?: string | null;
  useYn?: string;
}

interface ActiveCodes {
  salesTypeCode: string;
  receiptTypeCode: string;
  paymentTypeCode: string;
  transactionProgressCode: string;
  packageUnitCode: string;
  quantityUnitCode: string;
  taxTypeCode: string;
  taxRateB: number;
}

interface VsdcCodeCache {
  fetchedAt: number;
  classes: Record<string, VsdcCodeDetail[]>;
  active: ActiveCodes;
}

export interface ZraSubmissionResult {
  success: boolean;
  resultCode?: string;
  resultMessage?: string;
  zraInvoiceNumber?: string;
  zraVerificationCode?: string;
  payload?: unknown;
  requestUrl?: string;
  requestHeaders?: Record<string, string>;
  rawResponse?: unknown;
}

export interface ZraCodeSyncResult {
  success: boolean;
  resultCode?: string;
  resultMessage?: string;
  activeCodes: ActiveCodes;
  classes?: Record<string, VsdcCodeDetail[]>;
  fetchedAt?: string;
  rawResponse?: unknown;
}

@Injectable()
export class ZraVsdcService {
  private readonly logger = new Logger(ZraVsdcService.name);
  private codeCache?: VsdcCodeCache;

  constructor(
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  isEnabled(): boolean {
    return this.configService.get<string>('ZRA_VSDC_ENABLED', 'false') === 'true';
  }

  isStrictMode(): boolean {
    return this.configService.get<string>('ZRA_VSDC_STRICT_MODE', 'false') === 'true';
  }

  async getCurrentCodeCache(): Promise<ZraCodeSyncResult> {
    const activeCodes = this.getDefaultActiveCodes();
    if (!this.codeCache) {
      return {
        success: false,
        resultMessage: 'No VSDC code cache in memory yet',
        activeCodes,
      };
    }

    return {
      success: true,
      activeCodes: this.codeCache.active,
      classes: this.codeCache.classes,
      fetchedAt: new Date(this.codeCache.fetchedAt).toISOString(),
    };
  }

  async syncCodeTables(tenantId: string, userId?: string): Promise<ZraCodeSyncResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        resultMessage: 'ZRA VSDC integration is disabled',
        activeCodes: this.getDefaultActiveCodes(),
      };
    }

    const baseUrl = this.configService.get<string>('ZRA_VSDC_BASE_URL');
    const tpin = this.configService.get<string>('ZRA_VSDC_TPIN');
    const bhfId = this.configService.get<string>('ZRA_VSDC_BHF_ID', '000');
    if (!baseUrl || !tpin || !bhfId) {
      return {
        success: false,
        resultMessage: 'Missing ZRA VSDC configuration (base URL, TPIN or branch ID)',
        activeCodes: this.getDefaultActiveCodes(),
      };
    }

    const endpoint = this.configService.get<string>('ZRA_VSDC_CODE_ENDPOINT', '/code/selectCodes');
    const url = `${baseUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers = this.buildRequestHeaders();
    const payload = {
      tpin,
      bhfId,
      lastReqDt: this.configService.get<string>('ZRA_VSDC_CODE_LAST_REQ_DT', '20100101000000'),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const responseBody = (await response.json().catch(() => null)) as any;
      const resultCode = responseBody?.resultCd;
      const resultMessage = responseBody?.resultMsg;

      if (!response.ok || resultCode !== '000') {
        return {
          success: false,
          resultCode,
          resultMessage: resultMessage || `Code sync failed with HTTP ${response.status}`,
          activeCodes: this.getDefaultActiveCodes(),
          rawResponse: responseBody,
        };
      }

      const clsList = Array.isArray(responseBody?.data?.clsList) ? responseBody.data.clsList : [];
      const classes = this.mapCodeClasses(clsList);
      const activeCodes = this.resolveActiveCodes(classes);

      this.codeCache = {
        fetchedAt: Date.now(),
        classes,
        active: activeCodes,
      };

      await this.auditService.log({
        tenantId,
        userId,
        action: 'VIEW',
        resource: 'zra_vsdc_code_sync',
        metadata: {
          endpoint,
          resultCode,
          activeCodes,
        },
      });

      return {
        success: true,
        resultCode,
        resultMessage,
        classes,
        activeCodes,
        fetchedAt: new Date(this.codeCache.fetchedAt).toISOString(),
        rawResponse: responseBody,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown VSDC error';
      this.logger.error(`Code sync failed: ${message}`);

      return {
        success: false,
        resultMessage: message,
        activeCodes: this.getDefaultActiveCodes(),
      };
    }
  }

  async previewSaleSubmission(
    source: ZraInvoicePayloadSource,
    tenantId: string,
    userId?: string,
  ): Promise<ZraSubmissionResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        resultMessage: 'ZRA VSDC integration is disabled',
      };
    }

    const prepared = await this.prepareSaleRequest(source, tenantId, userId);
    if (!prepared.success) {
      return prepared;
    }

    return {
      success: true,
      resultMessage: 'Payload preview generated',
      requestUrl: prepared.requestUrl,
      requestHeaders: prepared.requestHeaders,
      payload: prepared.payload,
    };
  }

  async submitSaleInvoice(
    source: ZraInvoicePayloadSource,
    tenantId: string,
    userId?: string,
  ): Promise<ZraSubmissionResult> {
    if (!this.isEnabled()) {
      return {
        success: false,
        resultMessage: 'ZRA VSDC integration is disabled',
      };
    }

    const prepared = await this.prepareSaleRequest(source, tenantId, userId);
    if (!prepared.success) {
      return prepared;
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VIEW',
      resource: 'zra_vsdc_submission',
      metadata: {
        phase: 'attempt',
        requestUrl: prepared.requestUrl,
        payload: prepared.payload,
      },
    });

    try {
      const response = await fetch(prepared.requestUrl!, {
        method: 'POST',
        headers: prepared.requestHeaders,
        body: JSON.stringify(prepared.payload),
      });

      const responseBody = (await response.json().catch(() => null)) as any;
      const resultCode = responseBody?.resultCd;
      const resultMessage = responseBody?.resultMsg;

      const baseResult: ZraSubmissionResult = {
        success: response.ok && resultCode === '000',
        resultCode,
        resultMessage: resultMessage || `VSDC request failed with HTTP ${response.status}`,
        requestUrl: prepared.requestUrl,
        requestHeaders: this.maskHeaders(prepared.requestHeaders),
        payload: prepared.payload,
        rawResponse: responseBody,
      };

      if (baseResult.success) {
        baseResult.zraInvoiceNumber = this.extractZraInvoiceNumber(responseBody?.data, (prepared.payload as any).invcNo);
        baseResult.zraVerificationCode = this.extractZraVerificationCode(responseBody?.data);
      }

      await this.auditService.log({
        tenantId,
        userId,
        action: 'EXPORT',
        resource: 'zra_vsdc_submission',
        metadata: {
          phase: 'result',
          success: baseResult.success,
          resultCode: baseResult.resultCode,
          resultMessage: baseResult.resultMessage,
          response: responseBody,
        },
      });

      return baseResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown VSDC error';
      this.logger.error(`VSDC submit failed: ${message}`);

      await this.auditService.log({
        tenantId,
        userId,
        action: 'EXPORT',
        resource: 'zra_vsdc_submission',
        metadata: {
          phase: 'result',
          success: false,
          resultMessage: message,
        },
      });

      return {
        success: false,
        resultMessage: message,
        requestUrl: prepared.requestUrl,
        requestHeaders: this.maskHeaders(prepared.requestHeaders),
        payload: prepared.payload,
      };
    }
  }

  private async prepareSaleRequest(
    source: ZraInvoicePayloadSource,
    tenantId: string,
    userId?: string,
  ): Promise<ZraSubmissionResult> {
    const baseUrl = this.configService.get<string>('ZRA_VSDC_BASE_URL');
    const tpin = this.configService.get<string>('ZRA_VSDC_TPIN');
    const bhfId = this.configService.get<string>('ZRA_VSDC_BHF_ID', '000');

    if (!baseUrl || !tpin || !bhfId) {
      return {
        success: false,
        resultMessage: 'Missing ZRA VSDC configuration (base URL, TPIN or branch ID)',
      };
    }

    const path = this.configService.get<string>('ZRA_VSDC_SALES_ENDPOINT', '/trnsSales/saveSales');
    const requestUrl = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    const requestHeaders = this.buildRequestHeaders();
    const activeCodes = await this.resolveActiveCodesForPayload(tenantId, userId);
    const payload = this.buildSalesPayload(source, { tpin, bhfId, userId, activeCodes });

    return {
      success: true,
      requestUrl,
      requestHeaders: this.maskHeaders(requestHeaders),
      payload,
    };
  }

  private buildRequestHeaders(): Record<string, string> {
    const cmcKey = this.configService.get<string>('ZRA_VSDC_CMC_KEY');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (cmcKey) {
      headers.cmcKey = cmcKey;
      headers['X-CMC-KEY'] = cmcKey;
      headers.Authorization = `Bearer ${cmcKey}`;
    }

    return headers;
  }

  private async resolveActiveCodesForPayload(tenantId: string, userId?: string): Promise<ActiveCodes> {
    const useRemoteCodes = this.configService.get<string>('ZRA_VSDC_USE_REMOTE_CODES', 'true') === 'true';
    if (!useRemoteCodes || !this.isEnabled()) {
      return this.getDefaultActiveCodes();
    }

    const ttlMinutes = Number(this.configService.get<string>('ZRA_VSDC_CODE_CACHE_TTL_MINUTES', '60'));
    const ttlMs = Math.max(ttlMinutes, 1) * 60_000;
    const isFresh = this.codeCache && Date.now() - this.codeCache.fetchedAt < ttlMs;
    if (isFresh) return this.codeCache!.active;

    const sync = await this.syncCodeTables(tenantId, userId);
    if (sync.success) return sync.activeCodes;

    this.logger.warn(`Falling back to configured codes because sync failed: ${sync.resultMessage || 'unknown error'}`);
    return this.codeCache?.active || this.getDefaultActiveCodes();
  }

  private mapCodeClasses(clsList: any[]): Record<string, VsdcCodeDetail[]> {
    const classes: Record<string, VsdcCodeDetail[]> = {};

    for (const cls of clsList) {
      const key = String(cls?.cdCls || '');
      if (!key) continue;
      const details = Array.isArray(cls?.dtlList) ? cls.dtlList : [];
      classes[key] = details
        .filter((d: any) => d?.cd)
        .map((d: any) => ({
          cd: String(d.cd),
          cdNm: d.cdNm ? String(d.cdNm) : undefined,
          userDfnCd1: d.userDfnCd1 ?? null,
          useYn: d.useYn ? String(d.useYn) : undefined,
        }));
    }

    return classes;
  }

  private resolveActiveCodes(classes: Record<string, VsdcCodeDetail[]>): ActiveCodes {
    const defaults = this.getDefaultActiveCodes();

    const select = (classCode: string, envName: string, fallbackCode: string): VsdcCodeDetail => {
      const list = classes[classCode] || [];
      const enabled = list.filter(c => (c.useYn || 'Y') === 'Y');
      const target = this.configService.get<string>(envName, fallbackCode);
      return enabled.find(c => c.cd === target)
        || enabled.find(c => c.cd === fallbackCode)
        || enabled[0]
        || { cd: fallbackCode };
    };

    const salesType = select('14', 'ZRA_VSDC_SALES_TYPE_CODE', defaults.salesTypeCode);
    const receiptType = select('37', 'ZRA_VSDC_RECEIPT_TYPE_CODE', defaults.receiptTypeCode);
    const paymentType = select('07', 'ZRA_VSDC_PAYMENT_TYPE_CODE', defaults.paymentTypeCode);
    const progress = select('11', 'ZRA_VSDC_TRANSACTION_PROGRESS_CODE', defaults.transactionProgressCode);
    const pkgUnit = select('17', 'ZRA_VSDC_PACKAGE_UNIT_CODE', defaults.packageUnitCode);
    const qtyUnit = select('10', 'ZRA_VSDC_QUANTITY_UNIT_CODE', defaults.quantityUnitCode);
    const taxType = select('04', 'ZRA_VSDC_TAX_TYPE_CODE', defaults.taxTypeCode);

    const parsedRate = Number(taxType.userDfnCd1 ?? defaults.taxRateB);
    const taxRateB = Number.isFinite(parsedRate) ? parsedRate : defaults.taxRateB;

    return {
      salesTypeCode: salesType.cd,
      receiptTypeCode: receiptType.cd,
      paymentTypeCode: paymentType.cd,
      transactionProgressCode: progress.cd,
      packageUnitCode: pkgUnit.cd,
      quantityUnitCode: qtyUnit.cd,
      taxTypeCode: taxType.cd,
      taxRateB,
    };
  }

  private getDefaultActiveCodes(): ActiveCodes {
    return {
      salesTypeCode: this.configService.get<string>('ZRA_VSDC_SALES_TYPE_CODE', 'N'),
      receiptTypeCode: this.configService.get<string>('ZRA_VSDC_RECEIPT_TYPE_CODE', 'S'),
      paymentTypeCode: this.configService.get<string>('ZRA_VSDC_PAYMENT_TYPE_CODE', '01'),
      transactionProgressCode: this.configService.get<string>('ZRA_VSDC_TRANSACTION_PROGRESS_CODE', '02'),
      packageUnitCode: this.configService.get<string>('ZRA_VSDC_PACKAGE_UNIT_CODE', 'NT'),
      quantityUnitCode: this.configService.get<string>('ZRA_VSDC_QUANTITY_UNIT_CODE', 'U'),
      taxTypeCode: this.configService.get<string>('ZRA_VSDC_TAX_TYPE_CODE', 'A'),
      taxRateB: Number(this.configService.get<string>('ZRA_VSDC_TAX_RATE_B', '16')),
    };
  }

  private buildSalesPayload(
    source: ZraInvoicePayloadSource,
    input: { tpin: string; bhfId: string; userId?: string; activeCodes: ActiveCodes },
  ) {
    const now = new Date();
    const issueDate = new Date(source.issueDate || now);
    const confirmedDate = this.formatDateTime(issueDate);
    const salesDate = this.formatDate(issueDate);
    const invcNo = this.toInvoiceNumber(source.invoiceNumber);

    const itemList = source.items.map((item, index) => {
      const qty = this.toNumber(item.quantity);
      const unitPrice = this.toNumber(item.unitPrice);
      const supplyAmount = this.round2(qty * unitPrice);
      const discountRate = this.toNumber(item.discountPercent || 0);
      const discountAmount = this.round2((supplyAmount * discountRate) / 100);
      const taxableAmount = this.round2(supplyAmount - discountAmount);
      const totalAmount = this.toNumber(item.total);
      const taxAmount = this.toNumber(item.vatAmount || 0);

      return {
        itemSeq: index + 1,
        itemCd: item.product?.sku || `ITEM${String(index + 1).padStart(4, '0')}`,
        itemClsCd: null,
        itemNm: item.description || item.product?.name || `Item ${index + 1}`,
        bcd: null,
        pkgUnitCd: input.activeCodes.packageUnitCode,
        pkg: 1,
        qtyUnitCd: input.activeCodes.quantityUnitCode,
        qty: this.round2(qty),
        prc: this.round2(unitPrice),
        splyAmt: taxableAmount,
        dcRt: this.round2(discountRate),
        dcAmt: discountAmount,
        isrccCd: null,
        isrccNm: null,
        isrcRt: null,
        isrcAmt: null,
        taxTyCd: input.activeCodes.taxTypeCode,
        taxblAmt: taxableAmount,
        totTaxAmt: this.round2(taxAmount),
        totAmt: this.round2(totalAmount),
      };
    });

    const totalTaxableAmount = this.toNumber(source.subtotal);
    const totalTaxAmount = this.toNumber(source.vatAmount);
    const totalAmount = this.toNumber(source.total);

    return {
      tpin: input.tpin,
      bhfId: input.bhfId,
      invcNo,
      orgInvcNo: 0,
      custTpin: source.customer?.tpin || null,
      custNm: source.customer?.name || 'Walk-in Customer',
      salesTyCd: input.activeCodes.salesTypeCode,
      rcptTyCd: input.activeCodes.receiptTypeCode,
      pmtTyCd: input.activeCodes.paymentTypeCode,
      salesSttsCd: input.activeCodes.transactionProgressCode,
      cfmDt: confirmedDate,
      salesDt: salesDate,
      stockRlsDt: confirmedDate,
      cnclReqDt: null,
      cnclDt: null,
      rfdDt: null,
      rfdRsnCd: null,
      totItemCnt: itemList.length,
      taxblAmtA: 0,
      taxblAmtB: this.round2(totalTaxableAmount),
      taxblAmtC: 0,
      taxblAmtD: 0,
      taxRtA: 0,
      taxRtB: input.activeCodes.taxRateB,
      taxRtC: 0,
      taxRtD: 0,
      taxAmtA: 0,
      taxAmtB: this.round2(totalTaxAmount),
      taxAmtC: 0,
      taxAmtD: 0,
      totTaxblAmt: this.round2(totalTaxableAmount),
      totTaxAmt: this.round2(totalTaxAmount),
      totAmt: this.round2(totalAmount),
      prchrAcptcYn: 'N',
      remark: `ERP invoice ${source.invoiceNumber}`,
      regrNm: source.tenant?.name || 'SYSTEM',
      regrId: input.userId || 'system',
      modrNm: source.tenant?.name || 'SYSTEM',
      modrId: input.userId || 'system',
      rptNo: invcNo,
      itemList,
    };
  }

  private toInvoiceNumber(invoiceNumber: string): number {
    const match = invoiceNumber.match(/(\d+)$/);
    if (match) return Number(match[1]);
    return Number(`${Date.now()}`.slice(-8));
  }

  private extractZraInvoiceNumber(data: any, fallbackInvoiceNo: number): string {
    return String(data?.rcptNo ?? data?.totRcptNo ?? fallbackInvoiceNo);
  }

  private extractZraVerificationCode(data: any): string {
    return String(data?.rcptSign ?? data?.intrlData ?? '').slice(0, 100);
  }

  private maskHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return headers;
    const masked = { ...headers };

    for (const key of Object.keys(masked)) {
      const lower = key.toLowerCase();
      if (lower.includes('authorization') || lower.includes('cmc')) {
        const value = masked[key] || '';
        masked[key] = value.length > 8 ? `${value.slice(0, 4)}****${value.slice(-4)}` : '****';
      }
    }

    return masked;
  }

  private toNumber(value: string | number | null | undefined): number {
    const n = typeof value === 'number' ? value : Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
