
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}


export function isBrowser() {
  return typeof window !== 'undefined';
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


export function logAppStartup(port: number = 3000): void {
  console.log(`
 Next.js app running!
 Local: http://localhost:${port}
  `);
}
