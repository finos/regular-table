const EVEN_STRIPE_CLASS = "stripes";
const ODD_STRIPE_CLASS = "reverse-stripes";
export const alternateStripes = (table, {
  evenStripeClassName = EVEN_STRIPE_CLASS,
  oddStripeClassName = ODD_STRIPE_CLASS
} = {}) => {
  const removeStyleListener = table.addStyleListener(() => {
    const tds = table.querySelectorAll("tbody tr:nth-of-type(1) td");
    const meta = table.getMeta(tds[0]);

    if (meta) {
      if (meta.y0 % 2 === 0) {
        table.classList.remove(oddStripeClassName);
        table.classList.add(evenStripeClassName);
      } else {
        table.classList.remove(evenStripeClassName);
        table.classList.add(oddStripeClassName);
      }
    }
  });
  return () => {
    removeStyleListener();
    table.classList.remove(evenStripeClassName);
    table.classList.remove(oddStripeClassName);
  };
};
//# sourceMappingURL=row_stripes.js.map