const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = {
  async getProducts() {
    const response = await fetch(API_BASE_URL + '/products');
    if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
    return await response.json();
  },

  async createOrder(orderData) {
    const response = await fetch(API_BASE_URL + '/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorDetail = await response.json();
      throw new Error(errorDetail.detail || 'Không thể đặt hàng, vui lòng thử lại');
    }

    return await response.json();
  }
};
