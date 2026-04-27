-- BẬT LẠI RLS với policies AN TOÀN
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Xóa policies cũ
DROP POLICY IF EXISTS "basic_select" ON profiles;

-- 1. User có thể xem profile của chính mình
CREATE POLICY "user_select_own_profile" ON profiles
    FOR SELECT USING (id = auth.uid());

-- 2. KHÔNG cho phép INSERT từ client (chỉ Edge Functions với service_role)
-- Không tạo INSERT policy

-- 3. KHÔNG cho phép UPDATE từ client (chỉ Edge Functions với service_role)
-- Không tạo UPDATE policy

-- 4. KHÔNG cho phép DELETE từ client (chỉ Edge Functions với service_role)
-- Không tạo DELETE policy

-- 5. KHÔNG cho phép admin xem profiles từ client (chỉ qua Edge Functions)
-- Không tạo policy admin select