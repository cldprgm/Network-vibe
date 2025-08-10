type VideoIntent = { interacted: boolean; userMuted: boolean };

interface IVideoVisibilityManager {
    register(el: HTMLVideoElement): () => void;
}

class RealVideoVisibilityManager implements IVideoVisibilityManager {
    private observer: IntersectionObserver;
    private visibility = new Map<HTMLVideoElement, number>();
    private VISIBLE_RATIO = 0.25;
    private userIntent = new WeakMap<HTMLVideoElement, VideoIntent>();

    constructor() {
        this.observer = new IntersectionObserver(this.handleEntries.bind(this), {
            threshold: [0, 0.25, 0.5, 0.65, 0.8, 1],
            root: null,
            rootMargin: '0px'
        });
    }

    private handleEntries(entries: IntersectionObserverEntry[]) {
        entries.forEach(e => {
            const el = e.target as HTMLVideoElement;
            this.visibility.set(el, e.intersectionRatio ?? 0);
        });

        let maxEl: HTMLVideoElement | null = null;
        let maxRatio = 0;
        this.visibility.forEach((ratio, el) => {
            if (ratio > maxRatio) {
                maxRatio = ratio;
                maxEl = el;
            }
        });

        if (maxEl && maxRatio >= this.VISIBLE_RATIO) {
            this.visibility.forEach((_, el) => {
                if (el === maxEl) {
                    try {
                        const intent = this.userIntent.get(el);
                        if (!intent || intent.interacted === false) {
                            el.muted = true;
                        }
                        el.playsInline = true;
                        const p = el.play();
                        if (p && typeof p.catch === 'function') p.catch(() => { });
                    } catch (err) { /* ignore */ }
                } else {
                    try { el.pause(); } catch (err) { /* ignore */ }
                }
            });
        } else {
            this.visibility.forEach((_, el) => {
                try { el.pause(); } catch (err) { /* ignore */ }
            });
        }
    }

    register(el: HTMLVideoElement) {
        this.visibility.set(el, 0);
        this.userIntent.set(el, { interacted: false, userMuted: el.muted });

        const onVolumeChange = () => {
            this.userIntent.set(el, { interacted: true, userMuted: el.muted });
        };
        const onUserInteract = () => {
            this.userIntent.set(el, { interacted: true, userMuted: el.muted });
        };

        el.addEventListener('volumechange', onVolumeChange);
        el.addEventListener('play', onUserInteract);
        el.addEventListener('click', onUserInteract);

        this.observer.observe(el);

        return () => {
            try { this.observer.unobserve(el); } catch { }
            this.visibility.delete(el);
            this.userIntent.delete(el);
            el.removeEventListener('volumechange', onVolumeChange);
            el.removeEventListener('play', onUserInteract);
            el.removeEventListener('click', onUserInteract);
            try { el.pause(); } catch { }
        };
    }

}

class NoopVideoVisibilityManager implements IVideoVisibilityManager {
    register(_: HTMLVideoElement) { return () => { }; }
}

export function getVideoVisibilityManager(): IVideoVisibilityManager {
    if (typeof window === 'undefined') {
        return new NoopVideoVisibilityManager();
    }

    const w = window as any;
    if (!w.__videoVisibilityManager) {
        w.__videoVisibilityManager = new RealVideoVisibilityManager();
    }
    return w.__videoVisibilityManager as IVideoVisibilityManager;
}