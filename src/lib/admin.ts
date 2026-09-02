export function getAdminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? 'ramonlorenzomartinez@gmail.com').trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getAdminEmail();
}
