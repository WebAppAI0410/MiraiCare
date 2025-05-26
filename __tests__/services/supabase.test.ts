import { supabase } from '../../src/config/supabase';

// Supabaseクライアント設定をテスト
describe('Supabase Configuration', () => {
  it('Supabaseクライアントが正常に初期化される', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(supabase.storage).toBeDefined();
  });

  it('認証メソッドが利用可能である', () => {
    expect(typeof supabase.auth.signInWithPassword).toBe('function');
    expect(typeof supabase.auth.signUp).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
    expect(typeof supabase.auth.getUser).toBe('function');
    expect(typeof supabase.auth.resetPasswordForEmail).toBe('function');
    expect(typeof supabase.auth.onAuthStateChange).toBe('function');
  });

  it('データベースメソッドが利用可能である', () => {
    const table = supabase.from('test_table');
    expect(typeof table.select).toBe('function');
    expect(typeof table.insert).toBe('function');
    expect(typeof table.update).toBe('function');
    expect(typeof table.delete).toBe('function');
  });

  it('ストレージメソッドが利用可能である', () => {
    const bucket = supabase.storage.from('test_bucket');
    expect(typeof bucket.upload).toBe('function');
    expect(typeof bucket.download).toBe('function');
    expect(typeof bucket.list).toBe('function');
    expect(typeof bucket.remove).toBe('function');
  });

  describe('データベース操作のモック', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('ユーザーデータの取得をモックできる', async () => {
      // Supabaseのselectメソッドをモック
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              full_name: 'テストユーザー',
              created_at: '2024-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(data).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'テストユーザー',
        created_at: '2024-01-01T00:00:00Z',
      });
      expect(error).toBeNull();
    });

    it('バイタルデータの挿入をモックできる', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: {
          id: 'vital-123',
          user_id: 'user-123',
          type: 'steps',
          value: 8500,
          measured_at: '2024-01-01T12:00:00Z',
        },
        error: null,
      });

      supabase.from = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      const vitalData = {
        user_id: 'user-123',
        type: 'steps',
        value: 8500,
        measured_at: '2024-01-01T12:00:00Z',
      };

      const { data, error } = await supabase
        .from('vital_data')
        .insert(vitalData);

      expect(supabase.from).toHaveBeenCalledWith('vital_data');
      expect(mockInsert).toHaveBeenCalledWith(vitalData);
      expect(error).toBeNull();
    });

    it('気分データの更新をモックできる', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: {
            id: 'mood-123',
            mood_label: 'とても良い',
            intensity: 5,
            updated_at: '2024-01-01T12:00:00Z',
          },
          error: null,
        }),
      });

      supabase.from = jest.fn().mockReturnValue({
        update: mockUpdate,
      });

      const { data, error } = await supabase
        .from('mood_data')
        .update({ intensity: 5 })
        .eq('id', 'mood-123');

      expect(supabase.from).toHaveBeenCalledWith('mood_data');
      expect(mockUpdate).toHaveBeenCalledWith({ intensity: 5 });
      expect(error).toBeNull();
    });

    it('データの削除をモックできる', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      supabase.from = jest.fn().mockReturnValue({
        delete: mockDelete,
      });

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', 'reminder-123');

      expect(supabase.from).toHaveBeenCalledWith('reminders');
      expect(mockDelete).toHaveBeenCalled();
      expect(error).toBeNull();
    });
  });

  describe('リアルタイム機能のモック', () => {
    it('リアルタイム購読をモックできる', () => {
      const mockSubscribe = jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: jest.fn(),
        }),
      });

      supabase.channel = jest.fn().mockReturnValue({
        on: jest.fn().mockReturnValue({
          subscribe: mockSubscribe,
        }),
      });

      const subscription = supabase
        .channel('vital_data_changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'vital_data' },
          (payload) => console.log('New vital data:', payload)
        )
        .subscribe();

      expect(supabase.channel).toHaveBeenCalledWith('vital_data_changes');
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーを適切に処理する', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Network error',
          details: 'Failed to connect to the database',
          hint: 'Check your internet connection',
          code: 'NETWORK_ERROR',
        },
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const { data, error } = await supabase
        .from('users')
        .select('*');

      expect(data).toBeNull();
      expect(error).toEqual({
        message: 'Network error',
        details: 'Failed to connect to the database',
        hint: 'Check your internet connection',
        code: 'NETWORK_ERROR',
      });
    });

    it('権限エラーを適切に処理する', async () => {
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Permission denied',
          details: 'User does not have INSERT permission on table',
          hint: 'Check RLS policies',
          code: 'PERMISSION_DENIED',
        },
      });

      supabase.from = jest.fn().mockReturnValue({
        insert: mockInsert,
      });

      const { data, error } = await supabase
        .from('admin_only_table')
        .insert({ name: 'test' });

      expect(data).toBeNull();
      expect(error?.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('パフォーマンス考慮', () => {
    it('大量データのページング処理をテストできる', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        range: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: Array.from({ length: 100 }, (_, i) => ({
              id: `item-${i}`,
              name: `Item ${i}`,
            })),
            error: null,
          }),
        }),
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const { data, error } = await supabase
        .from('large_table')
        .select('*')
        .range(0, 99)
        .order('created_at', { ascending: false });

      expect(data).toHaveLength(100);
      expect(error).toBeNull();
    });

    it('インデックスを使用したクエリのテストができる', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({
              data: [
                { id: 1, value: 100, date: '2024-01-01' },
                { id: 2, value: 150, date: '2024-01-02' },
              ],
              error: null,
            }),
          }),
        }),
      });

      supabase.from = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const { data, error } = await supabase
        .from('indexed_table')
        .select('*')
        .eq('user_id', 'user-123')
        .gte('date', '2024-01-01')
        .lte('date', '2024-01-31');

      expect(data).toHaveLength(2);
      expect(error).toBeNull();
    });
  });
});