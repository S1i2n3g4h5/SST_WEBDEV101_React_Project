import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [globalData, setGlobalData] = useState(null);
  const [countriesData, setCountriesData] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalRes, countriesRes] = await Promise.all([
          fetch('https://disease.sh/v3/covid-19/all'),
          fetch('https://disease.sh/v3/covid-19/countries')
        ]);
        
        if (!globalRes.ok || !countriesRes.ok) throw new Error('Data fetch failed');
        
        const globalInfo = await globalRes.json();
        const countriesInfo = await countriesRes.json();
        
        // Sort countries alphabetically
        countriesInfo.sort((a, b) => a.country.localeCompare(b.country));
        
        setGlobalData(globalInfo);
        setCountriesData(countriesInfo);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCountryChange = (e) => {
    const countryObj = countriesData.find(c => c.country === e.target.value);
    setSelectedCountry(countryObj || null);
  };

  const determineSeverity = (activeCases) => {
    if (activeCases > 50000) return { label: 'High Severity', className: 'severity-high' };
    if (activeCases > 10000) return { label: 'Medium Severity', className: 'severity-medium' };
    return { label: 'Low Severity', className: 'severity-low' };
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
      <p>Fetching latest COVID-19 data...</p>
    </div>
  );

  if (error) return <div className="loading"><p>Error: {error}</p></div>;

  const displayData = selectedCountry ? [selectedCountry] : countriesData;

  return (
    <div className="dashboard-container">
      <header>
        <h1 className="title">COVID-19 Tracker</h1>
        <p className="subtitle">Real-time Global & Country Statistics</p>
      </header>

      {/* Global Summary */}
      {!selectedCountry && globalData && (
        <section className="global-stats">
          <div className="stat-card cases">
            <h3 className="card-title">Global Cases</h3>
            <p className="card-value">{globalData.cases.toLocaleString()}</p>
            <p className="subtitle">+{globalData.todayCases.toLocaleString()} today</p>
          </div>
          <div className="stat-card recovered">
            <h3 className="card-title">Global Recovered</h3>
            <p className="card-value">{globalData.recovered.toLocaleString()}</p>
            <p className="subtitle">+{globalData.todayRecovered.toLocaleString()} today</p>
          </div>
          <div className="stat-card deaths">
            <h3 className="card-title">Global Deaths</h3>
            <p className="card-value">{globalData.deaths.toLocaleString()}</p>
            <p className="subtitle">+{globalData.todayDeaths.toLocaleString()} today</p>
          </div>
        </section>
      )}

      {/* Controls */}
      <section className="controls">
        <select className="search-select" onChange={handleCountryChange} defaultValue="">
          <option value="">🌎 Global Overview (Select Country)</option>
          {countriesData.map((c) => (
            <option key={c.countryInfo.iso3 || c.country} value={c.country}>
              {c.country}
            </option>
          ))}
        </select>

        <div className="view-toggles">
          <button 
            className={`toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
            onClick={() => setViewMode('card')}
          >
            Card View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Table View
          </button>
        </div>
      </section>

      {/* Selected Country Header */}
      {selectedCountry && (
        <div className="country-header">
          <img className="country-flag" src={selectedCountry.countryInfo.flag} alt={`${selectedCountry.country} flag`} />
          <h2 className="country-name">{selectedCountry.country}</h2>
        </div>
      )}

      {/* Content Display */}
      {viewMode === 'card' ? (
        <div className="global-stats">
          {displayData.slice(0, 12).map((item) => {
            const severity = determineSeverity(item.active);
            return (
              <div key={item.countryInfo._id || item.country} className={`stat-card ${selectedCountry ? 'cases' : ''}`}>
                {!selectedCountry && (
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}>
                    <img src={item.countryInfo.flag} alt="" style={{width: '30px', borderRadius: '4px'}} />
                    <h3 className="card-title" style={{margin: 0, color: 'var(--text-primary)'}}>{item.country}</h3>
                  </div>
                )}
                {selectedCountry && <h3 className="card-title">Statistics</h3>}
                
                <div style={{marginBottom: '10px'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Total Cases: </span>
                  <strong style={{color: 'var(--cases-color)'}}>{item.cases.toLocaleString()}</strong>
                </div>
                <div style={{marginBottom: '10px'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Recovered: </span>
                  <strong style={{color: 'var(--recovered-color)'}}>{item.recovered.toLocaleString()}</strong>
                </div>
                <div style={{marginBottom: '15px'}}>
                  <span style={{color: 'var(--text-secondary)'}}>Deaths: </span>
                  <strong style={{color: 'var(--deaths-color)'}}>{item.deaths.toLocaleString()}</strong>
                </div>
                
                <span className={`severity-indicator ${severity.className}`}>
                  {severity.label}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Total Cases</th>
                <th>Recovered</th>
                <th>Deaths</th>
                <th>Active (Severity)</th>
              </tr>
            </thead>
            <tbody>
              {displayData.slice(0, 50).map((item) => {
                const severity = determineSeverity(item.active);
                return (
                  <tr key={item.countryInfo._id || item.country}>
                    <td style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <img src={item.countryInfo.flag} alt="" style={{width: '24px', borderRadius: '2px'}} />
                      {item.country}
                    </td>
                    <td style={{color: 'var(--cases-color)', fontWeight: 'bold'}}>{item.cases.toLocaleString()}</td>
                    <td style={{color: 'var(--recovered-color)', fontWeight: 'bold'}}>{item.recovered.toLocaleString()}</td>
                    <td style={{color: 'var(--deaths-color)', fontWeight: 'bold'}}>{item.deaths.toLocaleString()}</td>
                    <td>
                      <span className={`severity-indicator ${severity.className}`}>
                        {severity.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {!selectedCountry && viewMode === 'card' && countriesData.length > 12 && (
        <p style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem'}}>
          Showing top 12 countries. Use search to find specific countries or switch to Table Mode for more.
        </p>
      )}
    </div>
  );
}

export default App;
