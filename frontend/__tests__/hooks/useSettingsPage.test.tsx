import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils';

const mockTenantsMe = vi.fn();
const mockTenantsUpdate = vi.fn();
const mockUsersList = vi.fn();
const mockUsersCreate = vi.fn();
const mockUsersUpdate = vi.fn();

vi.mock('@/lib/api', () => ({
  tenantsApi: {
    me: (...args: any[]) => mockTenantsMe(...args),
    update: (...args: any[]) => mockTenantsUpdate(...args),
  },
  usersApi: {
    list: (...args: any[]) => mockUsersList(...args),
    create: (...args: any[]) => mockUsersCreate(...args),
    update: (...args: any[]) => mockUsersUpdate(...args),
  },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useSettingsPage } from '@/hooks/useSettingsPage';

const MOCK_TENANT = { id: 't1', name: 'Acme Ltd', slug: 'acme' };
const MOCK_USERS = [
  { id: 'u1', email: 'admin@acme.com', role: 'admin' },
  { id: 'u2', email: 'staff@acme.com', role: 'staff' },
];

describe('useSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantsMe.mockResolvedValue(MOCK_TENANT);
    mockUsersList.mockResolvedValue(MOCK_USERS);
  });

  it('returns expected initial state', async () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });

    expect(result.current.tab).toBe('company');
    expect(result.current.userModal).toBe(false);
    expect(result.current.tabs).toContain('company');
    expect(result.current.tabs).toContain('users');
    expect(result.current.roles).toContain('admin');
    expect(result.current.roles).toContain('staff');
    expect(result.current.roleColors).toHaveProperty('admin');
  });

  it('changes tab', () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    act(() => result.current.setTab('users'));
    expect(result.current.tab).toBe('users');
  });

  it('openUserModal opens modal', () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    act(() => result.current.openUserModal());
    expect(result.current.userModal).toBe(true);
  });

  it('loads tenant data', async () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    await waitFor(() => expect(mockTenantsMe).toHaveBeenCalled());
    expect(result.current.tenantForm).toBeDefined();
  });

  it('only fetches users when tab is users', async () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    // On company tab, should not fetch users yet
    await waitFor(() => expect(mockTenantsMe).toHaveBeenCalled());
    expect(mockUsersList).not.toHaveBeenCalled();

    act(() => result.current.setTab('users'));
    await waitFor(() => expect(result.current.users).toEqual(MOCK_USERS));
  });

  it('tenantForm and userForm are defined', () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    expect(result.current.tenantForm).toBeDefined();
    expect(result.current.userForm).toBeDefined();
  });

  it('mutations are defined', () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    expect(typeof result.current.updateTenantMutation.mutate).toBe('function');
    expect(typeof result.current.createUserMutation.mutate).toBe('function');
    expect(typeof result.current.updateUserMutation.mutate).toBe('function');
  });

  it('roleColors has correct classes for each role', () => {
    const { result } = renderHook(() => useSettingsPage(), { wrapper: createWrapper() });
    expect(result.current.roleColors.admin).toContain('red');
    expect(result.current.roleColors.staff).toContain('blue');
    expect(result.current.roleColors.accountant).toContain('purple');
    expect(result.current.roleColors.viewer).toContain('gray');
  });
});
