import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProductStore from "./components/ProductStore";
import CheckoutSummary from "./components/CheckoutSummary";
import SuccessPage from "./components/SuccessPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductStore />} />
        <Route path="/checkout-summary" element={<CheckoutSummary />} />
        <Route path="/success" element={<SuccessPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
