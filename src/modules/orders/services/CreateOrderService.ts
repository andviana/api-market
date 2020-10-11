import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    if (!customer_id) {
      throw new AppError('invalid customer_id');
    }
    if (!products) {
      throw new AppError('invalid products');
    }

    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const ids = products.map(product => {
      return { id: product.id };
    });

    const productsList = await this.productsRepository.findAllById(ids);

    if (productsList.length < 1) {
      throw new AppError('Products not found');
    }

    // criar order products
    const orderProductsList = products.map(item => {
      const indexProductList = productsList.findIndex(
        product => product.id === item.id,
      );
      if (item.quantity > productsList[indexProductList].quantity) {
        throw new AppError(
          `Insufficient product quantity:
          ${productsList[indexProductList].name}
          . Only
          ${productsList[indexProductList].quantity}
           available`,
        );
      }
      return {
        product_id: item.id,
        price: productsList[indexProductList].price,
        quantity: item.quantity,
      };
    });

    // criar order
    const order = await this.ordersRepository.create({
      customer,
      products: orderProductsList,
    });

    // atualizar quantidades
    const updateList = products.map(item => {
      const productListIndex = productsList.findIndex(
        product => product.id === item.id,
      );
      return {
        id: item.id,
        quantity: productsList[productListIndex].quantity - item.quantity,
      };
    });

    await this.productsRepository.updateQuantity(updateList);

    // retornar order
    return order;
  }
}

export default CreateOrderService;
