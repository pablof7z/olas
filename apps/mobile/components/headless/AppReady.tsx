import { useAppSub } from '@/hooks/app-sub';

export default function AppReady() {
    useAppSub();
    // useSessionSub();

    return null;
}
