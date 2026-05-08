// import { create } from 'zustand';

// const applyTheme = (theme) => {
//   const html = document.documentElement;
//   const body = document.body;
//   if (theme === 'dark') {
//     html.classList.add('dark');
//     body.className = 'dark';
//   } else {
//     html.classList.remove('dark');
//     body.className = 'light';
//   }
// };

// const useThemeStore = create((set) => ({
//   theme: localStorage.getItem('theme') || 'dark',
//   toggleTheme: () =>
//     set((state) => {
//       const newTheme = state.theme === 'dark' ? 'light' : 'dark';
//       localStorage.setItem('theme', newTheme);
//       applyTheme(newTheme);
//       return { theme: newTheme };
//     }),
//   initTheme: () =>
//     set((state) => {
//       applyTheme(state.theme);
//       return {};
//     }),
// }));

// export default useThemeStore;