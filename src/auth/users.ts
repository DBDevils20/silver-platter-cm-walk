export interface AppUser {
  username: string;
  password: string;
}

// Placeholder credentials — replace with a real auth service before wide rollout.
export const APP_USERS: AppUser[] = [
  { username: 'admin', password: '1234' },
  { username: 'Vic Cole', password: '1234' },
  { username: 'Alex Boyd', password: '1234' },
  { username: 'Judah Sheck', password: '1234' },
  { username: 'Jerrad Hillis', password: '1234' },
  { username: 'Ken Cox', password: '1234' },
  { username: 'Jerrad Atkins', password: '1234' },
  { username: 'Allan Garcia', password: '1234' },
  { username: 'Greg Moore', password: '1234' }
];

export function authenticate(username: string, password: string): AppUser | null {
  const user = APP_USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || user.password !== password) return null;
  return user;
}
