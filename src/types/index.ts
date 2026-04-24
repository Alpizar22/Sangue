export type ProductStatus = "active" | "inactive" | "out_of_stock"
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "ordered_to_supplier"
  | "shipped"
  | "delivered"
  | "cancelled"

export interface Product {
  id: string
  created_at: string
  updated_at: string
  shein_product_id: string
  shein_url: string
  title: string
  description: string | null
  images: string[]
  original_price: number   // Precio en Shein (ARS o USD)
  sale_price: number       // Precio que ve el cliente en Sangue
  cost_price: number       // Precio que pagamos en Shein
  stock: number
  category: string
  tags: string[]
  sizes: string[]
  colors: string[]
  status: ProductStatus
  shein_sku: string | null
  markup_percentage: number
  subcategory?: string | null
  seccion?: string | null
}

export interface CartItem {
  product_id: string
  product: Product
  quantity: number
  size: string
  color: string
}

export interface Customer {
  id: string
  created_at: string
  email: string
  name: string
  phone: string | null
  address: ShippingAddress | null
}

export interface ShippingAddress {
  street: string
  number: string
  floor?: string
  apartment?: string
  colonia?: string
  city: string
  province: string
  postal_code: string
  country: string
}

export interface Order {
  id: string
  created_at: string
  updated_at: string
  customer_id: string
  customer?: Customer
  items: OrderItem[]
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  total: number
  mercadopago_payment_id: string | null
  mercadopago_preference_id: string | null
  shipping_address: ShippingAddress
  notes: string | null
  supplier_order_id: string | null   // ID del pedido en Shein
  tracking_number: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  size: string
  color: string
  unit_price: number
  unit_cost: number
  shein_sku: string | null
}

export interface ScrapingJob {
  id: string
  created_at: string
  status: "pending" | "running" | "completed" | "failed"
  source_url: string
  products_found: number
  products_imported: number
  error: string | null
  completed_at: string | null
}

export interface PricingRule {
  id: string
  name: string
  category: string | null
  markup_type: "percentage" | "fixed"
  markup_value: number
  min_price: number | null
  max_price: number | null
  active: boolean
}
