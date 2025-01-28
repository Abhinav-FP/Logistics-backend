module.exports = ({
    name,
    description,
    pickup_location,
    drop_location,
    current_location,
    customer_id,
    status,
    shipper_id,
    broker_id,
    carrier_id,
    driver_id,
    shippingDate,
    deliveryDateExpect,
    cost,
    paymentStatus,
    quantity,
    weight,
    dimensions,
    typeOfGoods,
  }) => {
    return `
     <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Shipment Bill of Lading</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 20px;
          }
          form {
              max-width: 600px;
              margin: auto;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .form-group {
              margin-bottom: 15px;
          }
          .form-group label {
              display: block;
              font-weight: bold;
              margin-bottom: 5px;
          }
          .form-group input, .form-group select, .form-group textarea {
              width: 100%;
              padding: 8px;
              border: 1px solid #ccc;
              border-radius: 4px;
          }
          .form-group button {
              background-color: #007BFF;
              color: white;
              padding: 10px 15px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
          }
          .form-group button:hover {
              background-color: #0056b3;
          }
      </style>
  </head>
  <body>
      <form>
          <h2>Shipment Bill of Lading</h2>
  
          <div class="form-group">
              <label for="name">Name</label>
              <input type="text" id="name" name="name" placeholder="${name}" required>
          </div>
  
          <div class="form-group">
              <label for="description">Description</label>
              <textarea id="description" name="description" placeholder="${description}" required></textarea>
          </div>
  
          <div class="form-group">
              <label for="pickup_location">Pickup Location</label>
              <input type="text" id="pickup_location" name="pickup_location" placeholder="${pickup_location}" required>
          </div>
  
          <div class="form-group">
              <label for="drop_location">Drop Location</label>
              <input type="text" id="drop_location" name="drop_location" placeholder="${drop_location}" required>
          </div>
  
          <div class="form-group">
              <label for="current_location">Current Location</label>
              <input type="text" id="current_location" name="current_location" placeholder="${current_location}">
          </div>
  
          <div class="form-group">
              <label for="customer_id">Customer ID</label>
              <input type="text" id="customer_id" name="customer_id" placeholder="${customer_id}" required>
          </div>
  
          <div class="form-group">
              <label for="status">Status</label>
              <select id="status" name="status">
                  <option value="pending" ${
                    status === "pending" ? "selected" : ""
                  }>Pending</option>
                  <option value="transit" ${
                    status === "transit" ? "selected" : ""
                  }>In Transit</option>
                  <option value="delivered" ${
                    status === "delivered" ? "selected" : ""
                  }>Delivered</option>
              </select>
          </div>
  
          <div class="form-group">
              <label for="shipper_id">Shipper ID</label>
              <input type="text" id="shipper_id" name="shipper_id" placeholder="${shipper_id}" required>
          </div>
  
          <div class="form-group">
              <label for="broker_id">Broker ID</label>
              <input type="text" id="broker_id" name="broker_id" placeholder="${broker_id}" required>
          </div>
  
          <div class="form-group">
              <label for="carrier_id">Carrier ID</label>
              <input type="text" id="carrier_id" name="carrier_id" placeholder="${carrier_id}">
          </div>
  
          <div class="form-group">
              <label for="driver_id">Driver ID</label>
              <input type="text" id="driver_id" name="driver_id" placeholder="${driver_id}">
          </div>
  
          <div class="form-group">
              <label for="shippingDate">Shipping Date</label>
              <input type="date" id="shippingDate" name="shippingDate" value="${shippingDate}" required>
          </div>
  
          <div class="form-group">
              <label for="deliveryDateExpect">Expected Delivery Date</label>
              <input type="date" id="deliveryDateExpect" name="deliveryDateExpect" value="${deliveryDateExpect}" required>
          </div>
  
          <div class="form-group">
              <label for="cost">Cost</label>
              <input type="number" id="cost" name="cost" placeholder="${cost}" required>
          </div>
  
          <div class="form-group">
              <label for="paymentStatus">Payment Status</label>
              <input type="text" id="paymentStatus" name="paymentStatus" placeholder="${paymentStatus}" required>
          </div>
  
          <div class="form-group">
              <label for="quantity">Quantity</label>
              <input type="number" id="quantity" name="quantity" placeholder="${quantity}" required>
          </div>
  
          <div class="form-group">
              <label for="weight">Weight</label>
              <input type="number" id="weight" name="weight" placeholder="${weight}" required>
          </div>
  
          <div class="form-group">
              <label for="dimensions">Dimensions</label>
              <input type="text" id="dimensions" name="dimensions" placeholder="${dimensions}" required>
          </div>
  
          <div class="form-group">
              <label for="typeOfGoods">Type of Goods</label>
              <input type="text" id="typeOfGoods" name="typeOfGoods" placeholder="${typeOfGoods}" required>
          </div>
  
          <div class="form-group">
              <button type="submit">Submit</button>
          </div>
      </form>
  </body>
  </html>
      `;
  };
  