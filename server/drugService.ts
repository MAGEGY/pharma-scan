import { db, schema } from './db';
import { eq, ilike, or, and, desc, asc, not, isNotNull } from 'drizzle-orm';
import { EgyptianDrug } from '../shared/schema';

export class DrugService {
  // Search drugs by name (English or Arabic)
  async searchDrugByName(searchName: string): Promise<EgyptianDrug | undefined> {
    const normalizedSearch = `%${searchName.toLowerCase().trim()}%`;
    
    const results = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(
        or(
          ilike(schema.egyptianDrugs.name, normalizedSearch),
          ilike(schema.egyptianDrugs.nameArabic, searchName)
        )
      )
      .limit(1);
    
    return results[0];
  }

  // Search drugs by active ingredient with pagination
  async searchDrugsByActiveIngredient(
    ingredient: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<EgyptianDrug[]> {
    const normalizedIngredient = `%${ingredient.toLowerCase().trim()}%`;
    
    return await db
      .select()
      .from(schema.egyptianDrugs)
      .where(
        ilike(schema.egyptianDrugs.activeIngredient, normalizedIngredient)
      )
      .limit(limit)
      .offset(offset);
  }

  // Get all drugs with pagination
  async getAllDrugs(
    limit: number = 50, 
    offset: number = 0,
    sortBy: 'name' | 'manufacturer' | 'category' = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<EgyptianDrug[]> {
    const orderField = sortBy === 'name' ? schema.egyptianDrugs.name :
                      sortBy === 'manufacturer' ? schema.egyptianDrugs.manufacturer :
                      schema.egyptianDrugs.category;
    
    const orderDirection = sortOrder === 'asc' ? asc(orderField) : desc(orderField);
    
    return await db
      .select()
      .from(schema.egyptianDrugs)
      .orderBy(orderDirection)
      .limit(limit)
      .offset(offset);
  }

  // Get drug by ID
  async getDrugById(id: number): Promise<EgyptianDrug | undefined> {
    const results = await db
      .select()
      .from(schema.egyptianDrugs)
      .where(eq(schema.egyptianDrugs.id, id))
      .limit(1);
    
    return results[0];
  }

  // Search drugs with multiple filters
  async searchDrugs(filters: {
    name?: string;
    category?: string;
    manufacturer?: string;
    activeIngredient?: string;
    limit?: number;
    offset?: number;
  }): Promise<EgyptianDrug[]> {
    const { name, category, manufacturer, activeIngredient, limit = 50, offset = 0 } = filters;
    
    const conditions = [];
    
    if (name) {
      const normalizedName = `%${name.toLowerCase().trim()}%`;
      conditions.push(
        or(
          ilike(schema.egyptianDrugs.name, normalizedName),
          ilike(schema.egyptianDrugs.nameArabic, name)
        )
      );
    }
    
    if (category) {
      conditions.push(ilike(schema.egyptianDrugs.category, `%${category}%`));
    }
    
    if (manufacturer) {
      conditions.push(ilike(schema.egyptianDrugs.manufacturer, `%${manufacturer}%`));
    }
    
    if (activeIngredient) {
      conditions.push(ilike(schema.egyptianDrugs.activeIngredient, `%${activeIngredient}%`));
    }
    
    let query = db.select().from(schema.egyptianDrugs);
    
    if (conditions.length > 0) {
      query = conditions.length === 1 ? 
        query.where(conditions[0]) : 
        query.where(and(...conditions));
    }
    
    return await query.limit(limit).offset(offset);
  }

  // Get drugs by category
  async getDrugsByCategory(
    category: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<EgyptianDrug[]> {
    return await db
      .select()
      .from(schema.egyptianDrugs)
      .where(ilike(schema.egyptianDrugs.category, `%${category}%`))
      .limit(limit)
      .offset(offset);
  }

  // Get unique categories
  async getUniqueCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: schema.egyptianDrugs.category })
      .from(schema.egyptianDrugs)
      .where(isNotNull(schema.egyptianDrugs.category));
    
    return results
      .map(r => r.category)
      .filter(Boolean) as string[];
  }

  // Get unique manufacturers
  async getUniqueManufacturers(): Promise<string[]> {
    const results = await db
      .selectDistinct({ manufacturer: schema.egyptianDrugs.manufacturer })
      .from(schema.egyptianDrugs)
      .where(isNotNull(schema.egyptianDrugs.manufacturer));
    
    return results
      .map(r => r.manufacturer)
      .filter(Boolean) as string[];
  }

  // Find alternatives based on active ingredient or category
  async findAlternatives(
    excludeName: string,
    activeIngredient?: string, 
    category?: string, 
    limit: number = 5
  ): Promise<EgyptianDrug[]> {
    const conditions = [];
    
    if (activeIngredient) {
      const normalizedIngredient = `%${activeIngredient.toLowerCase()}%`;
      conditions.push(ilike(schema.egyptianDrugs.activeIngredient, normalizedIngredient));
    }
    
    if (category && !activeIngredient) {
      conditions.push(ilike(schema.egyptianDrugs.category, `%${category}%`));
    }
    
    if (conditions.length === 0) {
      return [];
    }
    
    const whereClause = conditions.length === 1 ? 
      conditions[0] : 
      and(...conditions);
    
    return await db
      .select()
      .from(schema.egyptianDrugs)
      .where(
        and(
          whereClause,
          // Exclude the original drug
          not(ilike(schema.egyptianDrugs.name, `%${excludeName}%`))
        )
      )
      .limit(limit);
  }

  // Get total count of drugs
  async getTotalCount(): Promise<number> {
    const result = await db
      .select({ count: schema.egyptianDrugs.id })
      .from(schema.egyptianDrugs);
    
    return result.length;
  }
}

export const drugService = new DrugService();
