import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // Import Firebase config
import "./display.css"; // Custom CSS for display and responsiveness
import { collection, getDocs } from "firebase/firestore";
import { FaCopy } from "react-icons/fa"; // Import FontAwesome copy icon
import * as XLSX from "xlsx"; // Import xlsx library for Excel download
import axios from "axios";
import * as cheerio from "cheerio";


// Utility function to format numbers based on Nepalese numbering system
const formatNumberNepal = (num) => {
  if (!num) return "0";
  const numString = num.toString();
  const lastThree = numString.slice(-3);
  const rest = numString.slice(0, -3);
  const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return rest ? formattedRest + "," + lastThree : lastThree;
};

const DisplayStockList = () => {
  const [stocks, setStocks] = useState([]);
  const [sortedStocks, setSortedStocks] = useState([]);
  const [ltpData, setLtpData] = useState({}); // State to store LTPs
  const [sortKey, setSortKey] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedSector, setSelectedSector] = useState("All");

  const sectorsWithLimitedColumns = [
    "Commercial Banks",
    "Development Banks",
    "Finance",
    "Microfinance",
    "Insurance",
    "Life Insurance",
  ];

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

        // Fetch LTP for all stocks
        fetchLTP(fetchedStocks);
      } catch (error) {
        console.error("Error fetching stocks: ", error);
      }
    };

    const fetchLTP = async (stocks) => {
      const ltpResults = {};
      for (const stock of stocks) {
        try {
          const symbol = stock.name;
          const url = `https://corsproxy.io/?https://merolagani.com/CompanyDetail.aspx?symbol=${symbol}`;
          const response = await axios.get(url);
          const $ = cheerio.load(response.data);
          const ltp = $("#ctl00_ContentPlaceHolder1_CompanyDetail1_lblMarketPrice").text();


          if (ltp) {
            ltpResults[symbol] = ltp;
          } else {
            ltpResults[symbol] = "N/A";
          }
        } catch (error) {
          console.error(`Error fetching LTP for ${stock.name}: `, error);
          ltpResults[stock.name] = "Error";
        }
      }
      setLtpData(ltpResults);
    };

    fetchStocks();
  }, []);

  const handleSort = (key) => {
    const newSortOrder = sortKey === key && sortOrder === "asc" ? "desc" : "asc";
    setSortKey(key);
    setSortOrder(newSortOrder);

    const sortedData = [...stocks].sort((a, b) => {
      if (key === "name") {
        return newSortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (key === "totalListedShares" || key === "publicShare") {
        const aValue =
          key === "publicShare" ? a.totalListedShares - a.promoterShare : a[key];
        const bValue =
          key === "publicShare" ? b.totalListedShares - b.promoterShare : b[key];
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

  const handleDownloadExcel = () => {
  const workbook = XLSX.utils.book_new(); // Create a new workbook

  // Group stocks by sector
  const sectors = [...new Set(sortedStocks.map((stock) => stock.sector))];

  sectors.forEach((sector) => {
    const sectorStocks = sortedStocks.filter((stock) => stock.sector === sector);
    const formattedData = sectorStocks.map((stock, index) => {
      const publicShare = stock.totalListedShares - stock.promoterShare;
      const promoterPercentage = (
        (stock.promoterShare / stock.totalListedShares) *
        100
      ).toFixed(2);
      const publicPercentage = (
        (publicShare / stock.totalListedShares) *
        100
      ).toFixed(2);
      const lockInPeriod = new Date(stock.listedDate);
      lockInPeriod.setFullYear(lockInPeriod.getFullYear() + 3);

      return {
        SNo: index + 1,
        Name: stock.name,
        ListedDate: stock.listedDate,
        LockInPeriod: lockInPeriod.toLocaleDateString(),
        TotalListedShares: formatNumberNepal(stock.totalListedShares),
        PromoterShare: formatNumberNepal(stock.promoterShare),
        PublicShare: formatNumberNepal(publicShare),
        PromoterPercentage: `${promoterPercentage}%`,
        PublicPercentage: `${publicPercentage}%`,
        BookValuePerShare: stock.bookValue,
        EPS: stock.eps,
        Remarks: stock.remark,
        LTP: ltpData[stock.name] || "N/A",
      };
    });

    // Add a new sheet for the sector
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, sector);
  });

  // Save the workbook
  XLSX.writeFile(workbook, "Stock_List_By_Sector.xlsx");
};


  const filteredStocks =
    selectedSector === "All"
      ? sortedStocks
      : sortedStocks.filter((stock) => stock.sector === selectedSector);

  return (
    <div className="container">
      <h1>Stock List</h1>

      {/* Filter by Sector */}
      <div className="filter-container">
        <label htmlFor="sector-filter">Filter by Sector:</label>
        <select
          id="sector-filter"
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
        >
          <option value="All">All Sectors</option>
          {[...new Set(stocks.map((stock) => stock.sector))].map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Sorting Buttons */}
      <div className="sorting-buttons">
        <button onClick={() => handleSort("name")}>
          Sort by Name ({sortKey === "name" && sortOrder === "asc" ? "A-Z" : "Z-A"})
        </button>
        <button onClick={() => handleSort("totalListedShares")}>
          Sort by Total Listed Shares (
          {sortKey === "totalListedShares" && sortOrder === "asc" ? "Asc" : "Desc"})
        </button>
        <button onClick={() => handleSort("publicShare")}>
          Sort by Public Share (
          {sortKey === "publicShare" && sortOrder === "asc" ? "Asc" : "Desc"})
        </button>
      </div>

      {/* Download Button */}
      <div className="download-button-container">
        <button onClick={handleDownloadExcel} className="download-button">
          Download to Excel
        </button>
      </div>

      {/* Sector-wise Display */}
      {[...new Set(filteredStocks.map((stock) => stock.sector))].map((sector) => (
        <div key={sector}>
          <h2 className="sector-title">{sector}</h2>
          <table className="transaction-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>S.N.</th>
                <th>Name</th>
                {!sectorsWithLimitedColumns.includes(sector) && <th>Listed Date</th>}
                {!sectorsWithLimitedColumns.includes(sector) && (
                  <th>Lock-in Period</th>
                )}
                <th>Total Listed Shares</th>
                <th>Promoter Share</th>
                <th>Public Share</th>
                <th>% of Promoter & Public</th>
                <th>Book Value Per Share</th>
                <th>EPS</th>
                <th>LTP</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks
                .filter((stock) => stock.sector === sector)
                .map((stock, index) => {
                  const publicShare =
                    stock.totalListedShares - stock.promoterShare;
                  const promoterPercentage = (
                    (stock.promoterShare / stock.totalListedShares) *
                    100
                  ).toFixed(2);
                  const publicPercentage = (
                    (publicShare / stock.totalListedShares) *
                    100
                  ).toFixed(2);
                  const lockInPeriod = new Date(stock.listedDate);
                  lockInPeriod.setFullYear(lockInPeriod.getFullYear() + 3);

                  return (
                    <tr key={stock.id}>
                      <td>
                        <div className="id-copy-container">
                          <FaCopy
                            className="copy-icon"
                            onClick={() => handleCopyId(stock.id)}
                          />
                        </div>
                      </td>
                      <td>{index + 1}</td>
                      <td>{stock.name}</td>
                      {!sectorsWithLimitedColumns.includes(sector) && (
                        <td>{stock.listedDate}</td>
                      )}
                      {!sectorsWithLimitedColumns.includes(sector) && (
                        <td>{lockInPeriod.toLocaleDateString()}</td>
                      )}
                      <td>{formatNumberNepal(stock.totalListedShares)}</td>
                      <td>{formatNumberNepal(stock.promoterShare)}</td>
                      <td>{formatNumberNepal(publicShare)}</td>
                      <td>
                        {promoterPercentage}% , {publicPercentage}%
                      </td>
                      <td>{stock.bookValue}</td>
                      <td>{stock.eps}</td>
                      <td>{ltpData[stock.name] || "N/A"}</td>
                      <td>{stock.remark}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default DisplayStockList;
