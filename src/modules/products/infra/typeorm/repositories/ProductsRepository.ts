import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = this.ormRepository.findOne({ where: { name } });
    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idList = products.map(product => product.id);
    const productsList = await this.ormRepository.find({ id: In(idList) });
    return productsList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const idList = products.map(product => {
      return { id: product.id };
    });

    const allProducts = await this.findAllById(idList);

    const newProducts = products.map(item => {
      const index = allProducts.findIndex(product => item.id === product.id);
      allProducts[index].quantity = item.quantity;
      return allProducts[index];
    });

    const updatedProducts = await this.ormRepository.save(newProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
