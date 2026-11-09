/**
 * Largest quantity of ONE cart line the API accepts (OrderItemDto @Max).
 * Shared so the cart store, the item sheet and the API cannot drift apart:
 * before this, the sheet allowed 50, the cart had no cap and the API rejected
 * anything over 20 with a 400 at checkout.
 */
export declare const MAX_LINE_QTY = 20;
