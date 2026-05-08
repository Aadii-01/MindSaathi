// import { create } from 'zustand';
// import { authAPI } from '../api/axios';

// const useAuthStore = create((set, get) => ({
//   // user: JSON.parse(localStorage.getItem('user') || 'null'),
//   // tokens: JSON.parse(localStorage.getItem('tokens') || 'null'),
//   // isAuthenticated: !!localStorage.getItem('tokens'),
//     user: { name: "Dev User" },   // fake user
//   tokens: { access: "dev-token" },
//   isAuthenticated: true, 
//   isLoading: false,
//   error: null,

//   login: async (email, password) => {
//     set({ isLoading: true, error: null });
//     try {
//       const res = await authAPI.login({ email, password });
//       const tokens = res.data;
//       localStorage.setItem('tokens', JSON.stringify(tokens));
      
//       // Fetch user profile
//       const profileRes = await authAPI.getProfile();
//       const user = profileRes.data;
//       localStorage.setItem('user', JSON.stringify(user));
      
//       set({ tokens, user, isAuthenticated: true, isLoading: false });
//       return { success: true };
//     } catch (err) {
//       const message = err.response?.data?.detail || 'Login failed. Please check your credentials.';
//       set({ error: message, isLoading: false });
//       return { success: false, error: message };
//     }
//   },

//   register: async (data) => {
//     set({ isLoading: true, error: null });
//     try {
//       const res = await authAPI.register(data);
//       const { user, tokens } = res.data;
//       localStorage.setItem('tokens', JSON.stringify(tokens));
//       localStorage.setItem('user', JSON.stringify(user));
//       set({ user, tokens, isAuthenticated: true, isLoading: false });
//       return { success: true };
//     } catch (err) {
//       const errors = err.response?.data;
//       let message = 'Registration failed.';
//       if (errors) {
//         const firstKey = Object.keys(errors)[0];
//         message = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
//       }
//       set({ error: message, isLoading: false });
//       return { success: false, error: message };
//     }
//   },

//   logout: async () => {
//     try {
//       const tokens = get().tokens;
//       if (tokens?.refresh) {
//         await authAPI.logout({ refresh: tokens.refresh });
//       }
//     } catch { /* ignore */ }
//     localStorage.removeItem('tokens');
//     localStorage.removeItem('user');
//     set({ user: null, tokens: null, isAuthenticated: false });
//   },

//   updateUser: (userData) => {
//     const updated = { ...get().user, ...userData };
//     localStorage.setItem('user', JSON.stringify(updated));
//     set({ user: updated });
//   },

//   clearError: () => set({ error: null }),
// }));

// export default useAuthStore;