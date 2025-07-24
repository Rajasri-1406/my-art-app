// src/App.tsx

import { useEffect, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import type {DataTablePageEvent} from "primereact/datatable";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import "./App.css";

type Artwork = {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
};

function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(5);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<Artwork[]>([]);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectCount, setSelectCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData(page, rows);
  }, [page, rows]);

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${page + 1}&limit=${size}`
      );
      const { data, pagination } = response.data;

      const artworks: Artwork[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      setArtworks(artworks);
      setTotalRecords(pagination.total);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const onPageChange = (e: DataTablePageEvent) => {
    setPage(e.page ?? 0);
    setRows(e.rows ?? 5);
  };

  const handleSelectNRows = async () => {
    let collected: Artwork[] = [];
    let currentPage = page + 1;
    const size = rows;

    while (collected.length < selectCount) {
      const response = await axios.get(
        `https://api.artic.edu/api/v1/artworks?page=${currentPage}&limit=${size}`
      );
      const pageData: Artwork[] = response.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        place_of_origin: item.place_of_origin,
        artist_display: item.artist_display,
        inscriptions: item.inscriptions,
        date_start: item.date_start,
        date_end: item.date_end,
      }));

      collected = [...collected, ...pageData];
      if (pageData.length < size) break;
      currentPage++;
    }

    setSelection(collected.slice(0, selectCount));
    setDropdownVisible(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titleHeader = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        position: "relative",
      }}
    >
      Title
      <span
        onClick={() => setDropdownVisible(!dropdownVisible)}
        style={{ cursor: "pointer" }}
      >
        <ChevronDown size={16} />
      </span>
      {dropdownVisible && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: "1.5rem",
            left: 0,
            background: "#fff",
            border: "1px solid #ccc",
            padding: "0.5rem",
            zIndex: 10,
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            width: "150px",
            borderRadius: "4px",
          }}
        >
          <input
            type="number"
            min={1}
            max={artworks.length}
            placeholder="Select rows..."
            value={selectCount || ""}
            onChange={(e) => setSelectCount(Number(e.target.value))}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <button onClick={handleSelectNRows} style={{ width: "100%" }}>
            Submit
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="card">
      <DataTable
        value={artworks}
        lazy
        paginator
        first={page * rows}
        rows={rows}
        totalRecords={totalRecords}
        loading={loading}
        onPage={onPageChange}
        dataKey="id"
        selectionMode="multiple"
        selection={selection}
        onSelectionChange={(e) => setSelection(e.value as Artwork[])

        }
      >
        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
        <Column field="title" header={titleHeader} />
        <Column field="place_of_origin" header="Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
}

export default App;
