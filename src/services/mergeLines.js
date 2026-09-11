export const mergeDuplicateLines = (lines) => {
  const map = new Map();
  const order = [];
  for (const item of lines) {
    const key = item.item_no;
    if (map.has(key)) {
      const existing = map.get(key);
      existing.requested_qty =
        (Number(existing.requested_qty) || 0) + (Number(item.requested_qty) || 0);
      existing.images = [...(existing.images || []), ...(item.images || [])];
    } else {
      map.set(key, { ...item, images: [...(item.images || [])] });
      order.push(key);
    }
  }
  return order.map((key) => map.get(key));
};