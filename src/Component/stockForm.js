import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import Toast from './Toast'; // Import Toast component
import './form.css'; // Import your CSS styles

const StockListForm = () => {
  const [name, setName] = useState("");
  const [listedDate, setListedDate] = useState("");
  const [totalListedShares, setTotalListedShares] = useState("");
  const [promoterShare, setPromoterShare] = useState("");
  const [bookValue, setBookValue] = useState("");
  const [eps, setEps] = useState("");
  const [remark, setRemark] = useState("");

  const [publicShare, setPublicShare] = useState("");
  const [promoterPublicPercent, setPromoterPublicPercent] = useState("");
  const [lockInPeriod, setLockInPeriod] = useState("");

  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Automatically calculate derived fields
    const calculatedPublicShare = totalListedShares - promoterShare;
    const calculatedPromoterPublicPercent = `${((promoterShare / totalListedShares) * 100).toFixed(2)}%, ${(100 - (promoterShare / totalListedShares) * 100).toFixed(2)}%`;
    const calculatedLockInPeriod = new Date(listedDate);
    calculatedLockInPeriod.setFullYear(calculatedLockInPeriod.getFullYear() + 3);

    setPublicShare(calculatedPublicShare);
    setPromoterPublicPercent(calculatedPromoterPublicPercent);
    setLockInPeriod(calculatedLockInPeriod.toLocaleDateString());

    try {
      // Add the data to the Firestore database
      const docRef = await addDoc(collection(db, "stocks"), {
        name,
        listedDate,
        lockInPeriod: calculatedLockInPeriod,
        totalListedShares: parseInt(totalListedShares),
        promoterShare: parseInt(promoterShare),
        publicShare: calculatedPublicShare,
        promoterPublicPercent: calculatedPromoterPublicPercent,
        bookValue: parseFloat(bookValue),
        eps: parseFloat(eps),
        remark,
      });

      // Show success toast
      setToastMessage("Stock details added successfully!");
      setToastType("success");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Clear the form fields
      setName("");
      setListedDate("");
      setTotalListedShares("");
      setPromoterShare("");
      setBookValue("");
      setEps("");
      setRemark("");
    } catch (error) {
      // Show error toast
      setToastMessage("Error adding stock details");
      setToastType("error");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      console.error("Error adding document: ", error);
    }
  };

  const handlePromoterShareChange = (e) => {
    setPromoterShare(e.target.value);

    // Calculate public share dynamically
    const calculatedPublicShare = totalListedShares - e.target.value;
    setPublicShare(calculatedPublicShare);

    // Calculate promoter and public percentage dynamically
    if (totalListedShares) {
      const promoterPercentage = ((e.target.value / totalListedShares) * 100).toFixed(2);
      const publicPercentage = (100 - promoterPercentage).toFixed(2);
      setPromoterPublicPercent(`${promoterPercentage}%, ${publicPercentage}%`);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Listed Date:</label>
          <input
            type="date"
            value={listedDate}
            onChange={(e) => setListedDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Total Listed Shares:</label>
          <input
            type="number"
            value={totalListedShares}
            onChange={(e) => setTotalListedShares(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Promoter Share:</label>
          <input
            type="number"
            value={promoterShare}
            onChange={handlePromoterShareChange}
            required
          />
        </div>

        <div>
          <label>Public Share:</label>
          <input type="number" value={publicShare} readOnly />
        </div>

        <div>
          <label>% of Promoter & Public:</label>
          <input type="text" value={promoterPublicPercent} readOnly />
        </div>

        <div>
          <label>Book Value Per Share:</label>
          <input
            type="number"
            value={bookValue}
            onChange={(e) => setBookValue(e.target.value)}
            required
          />
        </div>

        <div>
          <label>EPS:</label>
          <input
            type="number"
            value={eps}
            onChange={(e) => setEps(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Remarks:</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        <button type="submit">Submit</button>
      </form>

      {/* Toast notification */}
      <Toast message={toastMessage} type={toastType} show={showToast} />
    </div>
  );
};

export default StockListForm;
