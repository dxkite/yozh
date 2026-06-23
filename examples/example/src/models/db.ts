import db from './db.json';

export const products = db.products;
export const productMap = new Map(products.map(p => [p.id, p]));
