// Utility functions for drag and drop functionality

export const handleDragStart = (
  e: React.DragEvent,
  index: number,
  setDraggedIndex: (index: number | null) => void
) => {
  setDraggedIndex(index);
  e.dataTransfer.effectAllowed = 'move';
};

export const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

export const handleDrop = <T>(
  e: React.DragEvent,
  targetIndex: number,
  draggedIndex: number | null,
  items: T[],
  setDraggedIndex: (index: number | null) => void,
  onReorder: (newItems: T[]) => void
) => {
  e.preventDefault();
  if (draggedIndex === null || draggedIndex === targetIndex) {
    setDraggedIndex(null);
    return;
  }

  const newItems = [...items];
  const draggedItem = newItems[draggedIndex];
  newItems.splice(draggedIndex, 1);
  newItems.splice(targetIndex, 0, draggedItem);

  setDraggedIndex(null);
  onReorder(newItems);
};

export const reorderItems = <T extends { order_index?: number }>(
  items: T[]
): T[] => {
  return items.map((item, index) => ({
    ...item,
    order_index: index + 1
  }));
};