import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Import Firebase config
import "./display.css"; // Custom CSS for display and responsiveness
import { collection, getDocs } from "firebase/firestore";
import { FaCopy } from "react-icons/fa"; // Import FontAwesome copy icon
import * as XLSX from 'xlsx'; // Import xlsx library for Excel download

const DisplayStockList = () => {
  const [stocks, setStocks] = useState([]);
  const [sortedStocks, setSortedStocks] = useState([]);
  const [sortKey, setSortKey] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc or desc

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "stocks"));
        const fetchedStocks = [];
        querySnapshot.forEach((doc) => {
          fetchedStocks.push({ ...doc.data(), id: doc.id });
        });
        setStocks(fetchedStocks);
        setSortedStocks(fetchedStocks); // Initialize sorted stocks
      } catch (error) {
        console.error("Error fetching stocks: ", error);
      }
    };

    fetchStocks();
  }, []);

  const handleSort = (key) => {
    const newSortOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(newSortOrder);

    const sortedData = [...stocks].sort((a, b) => {
      if (key === "name") {
        // Alphabetical sorting for stock name
        if (newSortOrder === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      } else if (key === "totalListedShares" || key === "publicShare") {
        // Numerical sorting for Total Listed Shares or Public Share
        const aValue = key === "publicShare" ? a.totalListedShares - a.promoterShare : a[key];
        const bValue = key === "publicShare" ? b.totalListedShares - b.promoterShare : b[key];
        return newSortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

    setSortedStocks(sortedData);
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    alert("Stock ID copied: " + id);
  };

  // Function to export data to Excel
  const handleDownloadExcel = () => {
    const formattedData = sortedStocks.map((stock, index) => {
      const publicShare = stock.totalListedShares - stock.promoterShare;
      const promoterPercentage = ((stock.promoterShare / stock.totalListedShares) * 100).toFixed(2);
      const publicPercentage = ((publicShare / stock.totalListedShares) * 100).toFixed(2);
      const lockInPeriod = new Date(stock.listedDate);
      lockInPeriod.setFullYear(lockInPeriod.getFullYear() + 3);

      return {
        SNo: index + 1,
        Name: stock.name,
        ListedDate: stock.listedDate,
        LockInPeriod: lockInPeriod.toLocaleDateString(),
        TotalListedShares: stock.totalListedShares,
        PromoterShare: stock.promoterShare,
        PublicShare: publicShare,
        PromoterPercentage: `${promoterPercentage}%`,
        PublicPercentage: `${publicPercentage}%`,
        BookValuePerShare: stock.bookValue,
        EPS: stock.eps,
        Remarks: stock.remark
      };
    });

    // Create a new workbook
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock List");

    // Download the Excel file
    XLSX.writeFile(wb, "Stock_List.xlsx");
  };

  return (
    <div className="container">
      <h1>Stock List</h1>

      {/* Sorting Buttons */}
      <div className="sorting-buttons">
        <button onClick={() => handleSort("name")}>
          Sort by Name ({sortKey === "name" && sortOrder === "asc" ? "A-Z" : "Z-A"})
        </button>
        <button onClick={() => handleSort("totalListedShares")}>
          Sort by Total Listed Shares ({sortKey === "totalListedShares" && sortOrder === "asc" ? "Asc" : "Desc"})
        </button>
        <button onClick={() => handleSort("publicShare")}>
          Sort by Public Share ({sortKey === "publicShare" && sortOrder === "asc" ? "Asc" : "Desc"})
        </button>
      </div>

      {/* Download Button */}
      <div className="download-button-container">
        <button onClick={handleDownloadExcel} className="download-button">
          Download to Excel
        </button>
      </div>

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>S.N.</th>
            <th>Name</th>
            <th>Listed Date</th>
            <th>Lock-in Period</th>
            <th>Total Listed Shares</th>
            <th>Promoter Share</th>
            <th>Public Share</th>
            <th>% of Promoter & Public</th>
            <th>Book Value Per Share</th>
            <th>EPS</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {sortedStocks.map((stock, index) => {
            const publicShare = stock.totalListedShares - stock.promoterShare;
            const promoterPercentage = ((stock.promoterShare / stock.totalListedShares) * 100).toFixed(2);
            const publicPercentage = ((publicShare / stock.totalListedShares) * 100).toFixed(2);
            const lockInPeriod = new Date(stock.listedDate);
            lockInPeriod.setFullYear(lockInPeriod.getFullYear() + 3);

            return (
              <tr key={stock.id}>
                <td>
                  <div className="id-copy-container">
                    <FaCopy className="copy-icon" onClick={() => handleCopyId(stock.id)} />
                  </div>
                </td>
                <td>{index + 1}</td>
                <td>{stock.name}</td>
                <td>{stock.listedDate}</td>
                <td>{lockInPeriod.toLocaleDateString()}</td>
                <td>{stock.totalListedShares}</td>
                <td>{stock.promoterShare}</td>
                <td>{publicShare}</td>
                <td>
                  {promoterPercentage}% , {publicPercentage}%
                </td>
                <td>{stock.bookValue}</td>
                <td>{stock.eps}</td>
                <td>{stock.remark}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DisplayStockList;
