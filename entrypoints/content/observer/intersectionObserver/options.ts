export const intersectionObserverOptions: IntersectionObserverInit = {
    threshold: Array.from({ length: 11 }, (_, i) => i * 0.1), // 简化阈值生成
    rootMargin: "300px",
};
