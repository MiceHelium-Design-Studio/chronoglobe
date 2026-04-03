import { notFound } from 'next/navigation';
import DebugClientCrash from './DebugClientCrash';

export default function DebugClientReactErrorPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <DebugClientCrash />;
}
