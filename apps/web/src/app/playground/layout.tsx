import type { ReactNode } from 'react';
import { PlaygroundShell } from './playground-shell';

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return <PlaygroundShell>{children}</PlaygroundShell>;
}
