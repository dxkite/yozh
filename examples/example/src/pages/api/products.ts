import type { APIRoute } from 'astro';
import { products } from '../../models/db';

export const GET: APIRoute = () => Response.json(products);
