// Viewport-fixed site widgets otherwise get painted over tall cells at the current scroll offset.
export const matrixCaptureCss = 'body > [data-widget] { display: none !important; } [data-lab-cell] *, [data-lab-cell] { content-visibility: visible !important; animation: none !important; transition: none !important; }';
