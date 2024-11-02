const getProducts = 'SELECT * FROM "Nuvom"';
const getProduct = 'SELECT * FROM "Nuvom" WHERE product_id = $1';
const getUserOrders = 'SELECT * FROM nuvomorders WHERE customer_id = $1';
const setOrder = 'INSERT INTO nuvomorders (customer_name, phone, order_size, order_id, order_color, order_count,total_price,status,customer_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)'


module.exports = {
    getProducts,
    getProduct,
    setOrder,
    getUserOrders,
}