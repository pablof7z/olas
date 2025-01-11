import { atom } from "jotai";

export type ImageRenderStats = {
    totalImageRenderCount: number;
    imageKeyCount: number;
    highestRenderCount: number;
    medianRenderCount: number;
    averageRenderCount: number;
}
export const imageRenderStatsAtom = atom<ImageRenderStats>({
    totalImageRenderCount: 0,
    imageKeyCount: 0,
    highestRenderCount: 0,
    medianRenderCount: 0,
    averageRenderCount: 0,
});
