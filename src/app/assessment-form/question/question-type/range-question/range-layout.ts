export interface MeasuredScaleLabel {
  position: number;
  row: string;
  width: number;
  minWidth?: number;
}

// Percentages describe values, not label widths. Reserve only the space that
// the actual endpoint labels need, while keeping every label centered on its value.
export function rangeLabelLayout(width: number, labels: MeasuredScaleLabel[]): {
  left: number; right: number; widths: number[];
} {
  const minimumGutter = Math.min(16, width / 4);
  const cap = Math.max(20, Math.min(120, width * 0.2));
  let left = minimumGutter;
  let right = minimumGutter;
  let widths: number[] = [];
  for (let iteration = 0; iteration < 8; iteration++) {
    const track = Math.max(1, width - left - right);
    widths = labels.map((label, index) => {
      const neighbours = labels.filter((other, otherIndex) => otherIndex !== index && other.row === label.row);
      const gap = neighbours.reduce((nearest, other) => Math.min(nearest, Math.abs(label.position - other.position) * track), track);
      const readableCap = Math.max(cap, Math.min(label.minWidth || 0, width * 0.3, 140));
      const minimum = Math.min(label.minWidth || 40, readableCap);
      return Math.min(label.width, readableCap, Math.max(minimum, gap - 6));
    });
    const nextLeft = Math.ceil(labels.reduce((gutter, label, index) =>
      Math.max(gutter, widths[index] / 2 - label.position * track), minimumGutter));
    const nextRight = Math.ceil(labels.reduce((gutter, label, index) =>
      Math.max(gutter, widths[index] / 2 - (1 - label.position) * track), minimumGutter));
    if (left === nextLeft && right === nextRight) break;
    left = nextLeft;
    right = nextRight;
  }
  return { left, right, widths };
}
