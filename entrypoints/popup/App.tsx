import { useState, useEffect } from "react";

function HomeView({ onCreateFilter, onEditFilter }) {
  const [filters, setFilters] = useState([]);

  useEffect(() => {
    // Load filters from chrome.storage.local
    chrome.storage.local.get("filters", (result) => {
      setFilters(result.filters || []);
    });
  }, []);

  // Group filters by action
  const groupedFilters = filters.reduce((groups, filter) => {
    const action = filter.action;
    if (!groups[action]) {
      groups[action] = [];
    }
    groups[action].push(filter);
    return groups;
  }, {});

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-center mb-4">Kinoted</h1>
      <h2 className="text-xl font-semibold mb-2">Your Preferences</h2>
      {["Block", "Mute", "Hide"].map((action) => (
        <div key={action} className="mb-2">
          <h3 className="font-semibold">{action}</h3>
          <ul>
            {groupedFilters[action]?.map((filter) => (
              <li
                key={filter.id}
                onClick={() => onEditFilter(filter)}
                className="cursor-pointer text-blue-500"
              >
                {filter.description}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button
        className="w-full bg-blue-500 text-white px-4 py-2 rounded"
        onClick={onCreateFilter}
      >
        Create Filter
      </button>
    </div>
  );
}

function CreateFilterView({ onBack, filterToEdit }) {
  const [description, setDescription] = useState(
    filterToEdit?.description || ""
  );
  const [action, setAction] = useState(filterToEdit?.action || "Hide");
  const [sensitivity, setSensitivity] = useState(
    filterToEdit?.sensitivity || 5
  );

  const saveFilter = () => {
    // Save or update the filter in chrome.storage.local
    chrome.storage.local.get("filters", (result) => {
      const filters = result.filters || [];
      if (filterToEdit) {
        // Update existing filter
        const index = filters.findIndex((f) => f.id === filterToEdit.id);
        if (index !== -1) {
          filters[index] = {
            ...filters[index],
            description,
            action,
            sensitivity,
          };
        }
      } else {
        // Add new filter
        filters.push({
          id: Date.now(),
          description,
          action,
          sensitivity,
        });
      }
      chrome.storage.local.set({ filters }, onBack);
    });
  };

  const deleteFilter = () => {
    // Delete the filter from chrome.storage.local
    chrome.storage.local.get("filters", (result) => {
      let filters = result.filters || [];
      filters = filters.filter((f) => f.id !== filterToEdit.id);
      chrome.storage.local.set({ filters }, onBack);
    });
  };

  return (
    <div className="w-full">
      <button className="text-blue-500 mb-4" onClick={onBack}>
        &lt; Back
      </button>
      <h1 className="text-xl font-bold mb-4">
        Describe what you want to filter out...
      </h1>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
        placeholder="Enter filter description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="mb-4">
        <label className="block font-semibold mb-2">Action</label>
        <div className="flex items-center mb-2">
          <input
            type="radio"
            id="hide"
            name="action"
            className="mr-2"
            checked={action === "Hide"}
            onChange={() => setAction("Hide")}
          />
          <label htmlFor="hide">Hide</label>
        </div>
        <div className="flex items-center mb-2">
          <input
            type="radio"
            id="mute"
            name="action"
            className="mr-2"
            checked={action === "Mute"}
            onChange={() => setAction("Mute")}
          />
          <label htmlFor="mute">Mute</label>
        </div>
        <div className="flex items-center">
          <input
            type="radio"
            id="block"
            name="action"
            className="mr-2"
            checked={action === "Block"}
            onChange={() => setAction("Block")}
          />
          <label htmlFor="block">Block</label>
        </div>
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-2">Sensitivity</label>
        <input
          type="range"
          min="1"
          max="100"
          className="w-full"
          value={sensitivity}
          onChange={(e) => setSensitivity(parseInt(e.target.value))}
        />
        <div className="text-center mt-2">Value: {sensitivity}</div>
      </div>
      <div className="flex justify-between">
        {filterToEdit && (
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={deleteFilter}
          >
            Delete
          </button>
        )}
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={saveFilter}
        >
          Save
        </button>
      </div>
    </div>
  );
}


function App() {
  const [currentView, setCurrentView] = useState("home");
  const [filterToEdit, setFilterToEdit] = useState(null);

  return (
    <div className="min-w-[400px] flex flex-col items-center justify-center p-4">
      {currentView === "home" && (
        <HomeView
          onCreateFilter={() => {
            setFilterToEdit(null);
            setCurrentView("createFilter");
          }}
          onEditFilter={(filter) => {
            setFilterToEdit(filter);
            setCurrentView("createFilter");
          }}
        />
      )}
      {currentView === "createFilter" && (
        <CreateFilterView
          onBack={() => setCurrentView("home")}
          filterToEdit={filterToEdit}
        />
      )}
    </div>
  );
}

export default App;
