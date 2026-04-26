// This maps a POS Product ID to an array of required inventory ingredients and amounts.

export interface RecipeIngredient {
  inventoryItemId: string;
  quantityRequired: number;
}

export const RECIPES: Record<string, RecipeIngredient[]> = {
  // Espresso
  '1': [
    { inventoryItemId: 'inv-1', quantityRequired: 0.018 }, // 18g Arabica
    { inventoryItemId: 'inv-9', quantityRequired: 1 },     // 1 Cup
  ],
  // Americano
  '2': [
    { inventoryItemId: 'inv-1', quantityRequired: 0.018 },
    { inventoryItemId: 'inv-9', quantityRequired: 1 },
  ],
  // Latte
  '3': [
    { inventoryItemId: 'inv-1', quantityRequired: 0.018 },
    { inventoryItemId: 'inv-3', quantityRequired: 0.2 },   // 200ml Milk
    { inventoryItemId: 'inv-9', quantityRequired: 1 },
  ],
  // Cappuccino
  '4': [
    { inventoryItemId: 'inv-1', quantityRequired: 0.018 },
    { inventoryItemId: 'inv-3', quantityRequired: 0.15 },
    { inventoryItemId: 'inv-9', quantityRequired: 1 },
  ],
  // Matcha Latte
  '8': [
    { inventoryItemId: 'inv-6', quantityRequired: 5 },     // 5g Matcha
    { inventoryItemId: 'inv-3', quantityRequired: 0.2 },   // 200ml Milk
    { inventoryItemId: 'inv-5', quantityRequired: 0.01 },  // 10g Sugar
    { inventoryItemId: 'inv-9', quantityRequired: 1 },
  ],
  // Earl Grey
  '7': [
    { inventoryItemId: 'inv-7', quantityRequired: 3 },     // 3g Tea leaves
    { inventoryItemId: 'inv-9', quantityRequired: 1 },
  ],
  // Croissant
  '9': [
    { inventoryItemId: 'inv-8', quantityRequired: 1 },     // 1 Croissant Dough
    { inventoryItemId: 'inv-10', quantityRequired: 1 },    // 1 Paper Bag
  ],
  // Blueberry Muffin
  '10': [
    { inventoryItemId: 'inv-10', quantityRequired: 1 },    // 1 Paper Bag
  ]
};
