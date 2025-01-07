import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import Toast from "./Toast"; // Import Toast component
import ConfirmationModal from "./ConfirmationModal"; // Import ConfirmationModal
import "./form.css"; // Import your CSS styles

const EditStockForm = () => {
  const [stockId, setStockId] = useState("");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [listedDate, setListedDate] = useState("");
  const [totalListedShares, setTotalListedShares] = useState("");
  const [promoterShare, setPromoterShare] = useState("");
  const [bookValue, setBookValue] = useState("");
  const [eps, setEps] = useState("");
  const [remark, setRemark] = useState("");

  const [publicShare, setPublicShare] = useState("");
  const [promoterPublicPercent, setPromoterPublicPercent] = useState("");
  const [lockInPeriod, setLockInPeriod] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false); // Track modal visibility

  // List of sectors
  const sectors = [
    "Commercial Banks",
    "Manufacturing And Processing",
    "Hotels And Tourism",
    "Others",
    "Hydro Power",
    "Tradings",
    "Non Life Insurance",
    "Development Banks",
    "Finance",
    "Microfinance",
    "Life Insurance",
    "Investment",
  ];

  // Sectors that do NOT require Listed Date and Lock-in Period
  const excludedSectors = [
    "Commercial Banks",
    "Development Banks",
    "Finance",
    "Microfinance",
    "Life Insurance",
    "Non Life Insurance",
  ];

  // Fetch stock data by stock ID
  const fetchStockData = async () => {
    if (!stockId) {
      setToastMessage("Please provide a stock ID");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      const docRef = doc(db, "stocks", stockId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const stockData = docSnap.data();
        setName(stockData.name);
        setSector(stockData.sector);
        setListedDate(stockData.listedDate);
        setTotalListedShares(stockData.totalListedShares);
        setPromoterShare(stockData.promoterShare);
        setPublicShare(stockData.publicShare);
        setPromoterPublicPercent(stockData.promoterPublicPercent);
        setLockInPeriod(stockData.lockInPeriod);
        setBookValue(stockData.bookValue);
        setEps(stockData.eps);
        setRemark(stockData.remark);
        setIsEditing(true);

        setToastMessage("Data fetched successfully!");
        setToastType("success");
        setShowToast(true);
      } else {
        setToastMessage("No stock found with that ID");
        setToastType("error");
        setShowToast(true);
      }

      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error fetching document: ", error);
      setToastMessage("Error fetching data");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Handle lock-in period calculation
  const handleListedDateChange = (e) => {
    const date = e.target.value;
    setListedDate(date);

    if (!excludedSectors.includes(sector)) {
      const calculatedLockIn = new Date(date);
      calculatedLockIn.setFullYear(calculatedLockIn.getFullYear() + 3);
      setLockInPeriod(calculatedLockIn.toLocaleDateString());
    } else {
      setLockInPeriod("");
    }
  };

  // Handle form submission to update data
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Automatically calculate derived fields
    const calculatedPublicShare = totalListedShares - promoterShare;
    const calculatedPromoterPublicPercent = `${((promoterShare / totalListedShares) * 100).toFixed(2)}%, ${(100 - (promoterShare / totalListedShares) * 100).toFixed(2)}%`;

    try {
      const docRef = doc(db, "stocks", stockId);
      await updateDoc(docRef, {
        name,
        sector,
        listedDate: excludedSectors.includes(sector) ? null : listedDate,
        lockInPeriod: excludedSectors.includes(sector) ? null : lockInPeriod,
        totalListedShares: parseInt(totalListedShares),
        promoterShare: parseInt(promoterShare),
        publicShare: calculatedPublicShare,
        promoterPublicPercent: calculatedPromoterPublicPercent,
        bookValue: parseFloat(bookValue),
        eps: parseFloat(eps),
        remark,
      });

      setToastMessage("Stock updated successfully!");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Reset form fields
      resetForm();
    } catch (error) {
      console.error("Error updating document: ", error);
      setToastMessage("Error updating stock");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Handle delete
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "stocks", stockId));
      setToastMessage("Stock deleted successfully!");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Reset form fields
      resetForm();
    } catch (error) {
      console.error("Error deleting document: ", error);
      setToastMessage("Error deleting stock");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setShowModal(false); // Close the modal after operation
    }
  };

  // Reset form fields
  const resetForm = () => {
    setStockId("");
    setName("");
    setSector("");
    setListedDate("");
    setTotalListedShares("");
    setPromoterShare("");
    setPublicShare("");
    setPromoterPublicPercent("");
    setLockInPeriod("");
    setBookValue("");
    setEps("");
    setRemark("");
    setIsEditing(false);
  };

  return (
    <div>
      {/* Input field to enter stock ID and fetch data */}
      <div>
        <label>Stock ID:</label>
        <input
          type="text"
          value={stockId}
          onChange={(e) => setStockId(e.target.value)}
          required
        />
        <button onClick={fetchStockData}>Fetch Stock Data</button>
      </div>

      {isEditing && (
        <form onSubmit={handleUpdate}>
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
            <label>Sector:</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
            >
              <option value="">Select Sector</option>
              {sectors.map((sec, index) => (
                <option key={index} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {!excludedSectors.includes(sector) && (
            <>
              <div>
                <label>Listed Date:</label>
                <input
                  type="date"
                  value={listedDate}
                  onChange={handleListedDateChange}
                  required
                />
              </div>

              <div>
                <label>Lock-in Period:</label>
                <input type="text" value={lockInPeriod} readOnly />
              </div>
            </>
          )}

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
              onChange={(e) => setPromoterShare(e.target.value)}
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
            <label>Remark:</label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>

          <button type="submit">Update Stock</button>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="delete-button"
          >
            Delete Stock
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this stock?"
          onConfirm={confirmDelete}
          onCancel={() => setShowModal(false)}
        />
      )}

      {/* Toast notification */}
      <Toast message={toastMessage} type={toastType} show={showToast} />
    </div>
  );
};

export default EditStockForm;
