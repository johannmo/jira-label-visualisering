import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

// Konfigurasjon - kan overskrivas med URL-parametrar
const getConfig = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    jiraHost: params.get('host') || localStorage.getItem('jira_host') || '',
    projectKey: params.get('project') || localStorage.getItem('jira_project') || '',
    // For Cloud brukar me API token via Basic Auth
  };
};

// Fargeskjema med god kontrast
const CATEGORY_COLORS = {
  type: ['#059669', '#0284c7', '#d97706', '#dc2626', '#7c3aed', '#db2777'],
  domene: ['#6366f1', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6'],
  tema: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6'],
};

const DEFAULT_CATEGORIES = {
  type: { name: 'Type', description: 'Oppgåvetype' },
  domene: { name: 'Domene', description: 'Fagområde' },
  tema: { name: 'Tema', description: 'Teknisk' },
};

// Demo-data for visning utan API-tilkopling
const DEMO_ISSUES = [
  { key: 'DEMO-1', labels: ['type-ny-funksjonalitet', 'domene-1', 'tema-backend'], assignee: 'ola.nordmann' },
  { key: 'DEMO-2', labels: ['type-vedlikehald', 'domene-2', 'tema-frontend'], assignee: 'kari.hansen' },
  { key: 'DEMO-3', labels: ['type-ny-funksjonalitet', 'domene-1', 'tema-integrasjon'], assignee: 'ola.nordmann' },
  { key: 'DEMO-4', labels: ['type-utforsking', 'domene-3', 'tema-backend'], assignee: 'per.jensen' },
  { key: 'DEMO-5', labels: ['type-vedlikehald', 'domene-1', 'tema-backend'], assignee: 'kari.hansen' },
  { key: 'DEMO-6', labels: ['type-ny-funksjonalitet', 'domene-2', 'tema-frontend'], assignee: 'ola.nordmann' },
  { key: 'DEMO-7', labels: ['type-utforsking', 'domene-2', 'tema-integrasjon'], assignee: 'per.jensen' },
  { key: 'DEMO-8', labels: ['type-vedlikehald', 'domene-3', 'tema-backend'], assignee: 'kari.hansen' },
  { key: 'DEMO-9', labels: ['type-ny-funksjonalitet', 'domene-1', 'tema-frontend'], assignee: 'ola.nordmann' },
  { key: 'DEMO-10', labels: ['type-ny-funksjonalitet', 'domene-2', 'tema-backend'], assignee: 'per.jensen' },
  { key: 'DEMO-11', labels: ['type-vedlikehald', 'domene-1', 'tema-integrasjon'], assignee: 'kari.hansen' },
  { key: 'DEMO-12', labels: ['type-utforsking', 'domene-3', 'tema-frontend'], assignee: 'ola.nordmann' },
  { key: 'DEMO-13', labels: ['type-ny-funksjonalitet', 'domene-3', 'tema-backend'], assignee: 'per.jensen' },
  { key: 'DEMO-14', labels: ['type-vedlikehald', 'domene-2', 'tema-backend'], assignee: 'kari.hansen' },
  { key: 'DEMO-15', labels: ['type-utforsking', 'domene-1', 'tema-frontend'], assignee: 'ola.nordmann' },
];

// VIKTIG: Oppdater denne URL-en med din Cloudflare Worker URL
const PROXY_URL = localStorage.getItem('proxy_url') || '';

function SetupForm({ onConnect, loading }) {
  const [host, setHost] = useState(localStorage.getItem('jira_host') || '');
  const [email, setEmail] = useState(localStorage.getItem('jira_email') || '');
  const [token, setToken] = useState('');
  const [project, setProject] = useState(localStorage.getItem('jira_project') || '');
  const [proxyUrl, setProxyUrl] = useState(PROXY_URL);

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('jira_host', host);
    localStorage.setItem('jira_email', email);
    localStorage.setItem('jira_project', project);
    localStorage.setItem('proxy_url', proxyUrl);
    onConnect({ host, email, token, project, proxyUrl });
  };

  const handleDemo = () => {
    onConnect({ demo: true });
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="logo">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#0052CC"/>
              <path d="M15.5 7L8 24h4l2-4.5h6L22 24h4L18.5 7h-3zm1.5 4.5l2 5h-4l2-5z" fill="white"/>
            </svg>
          </div>
          <h1>Jira Label Visualisering</h1>
          <p>Kople til Jira for å visualisera etikettfordeling</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="proxy">
              Proxy URL
              <span className="required-badge">påkravd</span>
            </label>
            <input
              id="proxy"
              type="url"
              placeholder="https://jira-proxy.ditt-namn.workers.dev"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value.replace(/\/$/, ''))}
              required
            />
            <span className="input-hint">Din Cloudflare Worker URL</span>
          </div>

          <div className="form-group">
            <label htmlFor="host">Jira Cloud URL</label>
            <input
              id="host"
              type="text"
              placeholder="ditt-team.atlassian.net"
              value={host}
              onChange={(e) => setHost(e.target.value.replace(/^https?:\/\//, ''))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              id="email"
              type="email"
              placeholder="din.epost@firma.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="token">
              API Token
              <a 
                href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="token-link"
              >
                Lag token →
              </a>
            </label>
            <input
              id="token"
              type="password"
              placeholder="Din Atlassian API token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="project">Prosjektnøkkel</label>
            <input
              id="project"
              type="text"
              placeholder="PROJ"
              value={project}
              onChange={(e) => setProject(e.target.value.toUpperCase())}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Koplar til...' : 'Kople til Jira'}
          </button>
        </form>

        <div className="divider">
          <span>eller</span>
        </div>

        <button onClick={handleDemo} className="btn-secondary">
          Sjå demo med testdata
        </button>

        <div className="setup-footer">
          <p>
            <strong>NB:</strong> API-token vert aldri lagra. 
            Host, e-post og prosjekt lagrast lokalt i nettlesaren.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChartSection({ title, data, colors, chartType = 'pie' }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = ((d.value / total) * 100).toFixed(1);
      return (
        <div className="chart-tooltip">
          <strong>{d.name}</strong>
          <span>{d.value} oppgåver ({pct}%)</span>
        </div>
      );
    }
    return null;
  };

  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.07) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="pie-label">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h3>{title}</h3>
        <span className="chart-total">{total} oppgåver</span>
      </div>

      <div className="chart-container">
        {chartType === 'pie' ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderLabel}
                outerRadius={100}
                innerRadius={35}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-stats">
        {data.map((item, i) => (
          <div key={item.name} className="stat-item">
            <span className="stat-color" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="stat-name">{item.name}</span>
            <span className="stat-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ issues, onDisconnect, isDemo, onRefresh, availableStatuses, currentJql }) {
  const [chartType, setChartType] = useState('pie');
  const [prefixFilter, setPrefixFilter] = useState(null);
  const [showJql, setShowJql] = useState(false);
  const [jqlCopied, setJqlCopied] = useState(false);

  const copyJql = async () => {
    try {
      await navigator.clipboard.writeText(currentJql);
      setJqlCopied(true);
      setTimeout(() => setJqlCopied(false), 2000);
    } catch {
      // Fallback for eldre nettlesarar
      const ta = document.createElement('textarea');
      ta.value = currentJql;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setJqlCopied(true);
      setTimeout(() => setJqlCopied(false), 2000);
    }
  };
  const [startDate, setStartDate] = useState(localStorage.getItem('jira_start_date') || '');
  const [endDate, setEndDate] = useState(localStorage.getItem('jira_end_date') || '');
  const [createdStartDate, setCreatedStartDate] = useState(localStorage.getItem('jira_created_start_date') || '');
  const [createdEndDate, setCreatedEndDate] = useState(localStorage.getItem('jira_created_end_date') || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAssignees, setSelectedAssignees] = useState(new Set());
  const [selectedDomain, setSelectedDomain] = useState(localStorage.getItem('jira_selected_domain') || '');
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());

  // Initialiser statusval når tilgjengelege statusar kjem inn
  useEffect(() => {
    if (availableStatuses.length > 0 && selectedStatuses.size === 0) {
      const defaults = new Set(
        availableStatuses.map(s => s.id)
      );
      setSelectedStatuses(defaults);
    }
  }, [availableStatuses]);

  const toggleStatus = (statusId) => {
    const newSelected = new Set(selectedStatuses);
    if (newSelected.has(statusId)) {
      newSelected.delete(statusId);
    } else {
      newSelected.add(statusId);
    }
    setSelectedStatuses(newSelected);
  };

  const handleRefresh = async () => {
    localStorage.setItem('jira_start_date', startDate);
    localStorage.setItem('jira_end_date', endDate);
    localStorage.setItem('jira_created_start_date', createdStartDate);
    localStorage.setItem('jira_created_end_date', createdEndDate);
    localStorage.setItem('jira_selected_domain', selectedDomain);
    setIsRefreshing(true);
    await onRefresh(startDate, endDate, createdStartDate, createdEndDate, Array.from(selectedAssignees), selectedDomain, Array.from(selectedStatuses));
    setIsRefreshing(false);
  };

  // Hent unike assignees frå issues
  const assignees = useMemo(() => {
    const uniqueAssignees = new Set();
    issues.forEach(issue => {
      if (issue.assignee) {
        uniqueAssignees.add(issue.assignee);
      }
    });
    return Array.from(uniqueAssignees).sort();
  }, [issues]);

  const toggleAssignee = (assignee) => {
    const newSelected = new Set(selectedAssignees);
    if (newSelected.has(assignee)) {
      newSelected.delete(assignee);
    } else {
      newSelected.add(assignee);
    }
    setSelectedAssignees(newSelected);
  };

  // Hent unike domener frå issues
  const domains = useMemo(() => {
    const uniqueDomains = new Set();
    issues.forEach(issue => {
      (issue.labels || []).forEach(label => {
        if (label.startsWith('domene-')) {
          uniqueDomains.add(label);
        }
      });
    });
    return Array.from(uniqueDomains).sort();
  }, [issues]);

  // Analyser labels og finn kategoriar automatisk
  const { categories, labelData } = useMemo(() => {
    const cats = new Map();
    const labelCounts = new Map();

    issues.forEach(issue => {
      (issue.labels || []).forEach(label => {
        const parts = label.split('-');
        if (parts.length >= 2) {
          const prefix = parts[0];
          const suffix = parts.slice(1).join('-');
          
          if (!cats.has(prefix)) {
            cats.set(prefix, new Map());
          }
          const suffixMap = cats.get(prefix);
          suffixMap.set(suffix, (suffixMap.get(suffix) || 0) + 1);
        }
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      });
    });

    return { categories: cats, labelData: labelCounts };
  }, [issues]);

  // Generer diagram-data for kvar kategori
  const chartDataByCategory = useMemo(() => {
    const result = {};
    categories.forEach((suffixMap, prefix) => {
      result[prefix] = Array.from(suffixMap.entries())
        .map(([suffix, count]) => ({
          name: suffix.charAt(0).toUpperCase() + suffix.slice(1).replace(/-/g, ' '),
          value: count,
          suffix,
        }))
        .sort((a, b) => b.value - a.value);
    });
    return result;
  }, [categories]);

  // Generer assignee-fordeling per kategori
  const assigneeDataByCategory = useMemo(() => {
    const result = {};
    
    categories.forEach((suffixMap, prefix) => {
      const assigneeCounts = new Map();
      
      // Tell kor mange saker kvar assignee har med denne kategori-prefixen
      issues.forEach(issue => {
        const hasPrefix = (issue.labels || []).some(label => label.startsWith(prefix + '-'));
        if (hasPrefix && issue.assignee) {
          assigneeCounts.set(issue.assignee, (assigneeCounts.get(issue.assignee) || 0) + 1);
        }
      });
      
      result[prefix] = Array.from(assigneeCounts.entries())
        .map(([assignee, count]) => ({
          name: assignee,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);
    });
    
    return result;
  }, [categories, issues]);

  const categoryList = Array.from(categories.keys());
  const displayCategories = prefixFilter ? [prefixFilter] : categoryList;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Jira Label Visualisering</h1>
          <span className="issue-count">
            {issues.length} oppgåver {isDemo && '(demo)'}
          </span>
        </div>
        <div className="header-right">
          {!isDemo && (
            <div className="date-filters">
              <div className="date-filter-group">
                <span className="date-filter-label">Oppdatert</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Oppdatert frå"
                />
                <span className="date-separator">–</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Oppdatert til"
                />
              </div>
              <div className="date-filter-group">
                <span className="date-filter-label">Oppretta</span>
                <input
                  type="date"
                  value={createdStartDate}
                  onChange={(e) => setCreatedStartDate(e.target.value)}
                  title="Oppretta frå"
                />
                <span className="date-separator">–</span>
                <input
                  type="date"
                  value={createdEndDate}
                  onChange={(e) => setCreatedEndDate(e.target.value)}
                  title="Oppretta til"
                />
              </div>
              {domains.length > 0 && (
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="domain-select"
                  title="Velg domene"
                >
                  <option value="">Alle domene</option>
                  {domains.map(domain => (
                    <option key={domain} value={domain}>
                      {domain.replace('domene-', '').charAt(0).toUpperCase() + domain.replace('domene-', '').slice(1)}
                    </option>
                  ))}
                </select>
              )}
              <button 
                onClick={handleRefresh} 
                className="btn-refresh"
                disabled={isRefreshing}
                title="Oppdater data"
              >
                {isRefreshing ? '⟳' : '↻'}
              </button>
            </div>
          )}
          <div className="chart-toggle">
            <button 
              className={chartType === 'pie' ? 'active' : ''} 
              onClick={() => setChartType('pie')}
              title="Sektordiagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M11 2v9H2a9 9 0 0 0 9 9 9 9 0 0 0 9-9 9 9 0 0 0-9-9m0 16a7 7 0 0 1-6.92-6H13V4.08A7 7 0 0 1 18 11a7 7 0 0 1-7 7"/>
              </svg>
            </button>
            <button 
              className={chartType === 'bar' ? 'active' : ''} 
              onClick={() => setChartType('bar')}
              title="Stolpediagram"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M22 21H2V3h2v16h2v-9h4v9h2V7h4v12h2v-5h4v7z"/>
              </svg>
            </button>
          </div>
          {!isDemo && currentJql && (
            <button
              onClick={() => setShowJql(v => !v)}
              className={`btn-jql ${showJql ? 'active' : ''}`}
              title="Vis JQL-spørjing"
            >
              JQL
            </button>
          )}
          <button onClick={onDisconnect} className="btn-disconnect">
            Kople frå
          </button>
        </div>
      </header>

      {showJql && currentJql && (
        <div className="jql-panel">
          <div className="jql-panel-header">
            <span className="jql-panel-title">JQL-spørjing</span>
            <button onClick={copyJql} className="btn-copy-jql">
              {jqlCopied ? '✓ Kopiert!' : 'Kopier'}
            </button>
          </div>
          <pre className="jql-code">{currentJql}</pre>
        </div>
      )}

      <div className="filter-bar">
        <span className="filter-label">Vis kategori:</span>
        <button 
          className={`filter-btn ${prefixFilter === null ? 'active' : ''}`}
          onClick={() => setPrefixFilter(null)}
        >
          Alle
        </button>
        {categoryList.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${prefixFilter === cat ? 'active' : ''}`}
            onClick={() => setPrefixFilter(cat)}
          >
            {DEFAULT_CATEGORIES[cat]?.name || cat}
          </button>
        ))}
      </div>

      {!isDemo && availableStatuses.length > 0 && (
        <div className="status-filter">
          <span className="filter-label">Filtrer etter status:</span>
          <div className="status-checkboxes">
            {availableStatuses.map(status => (
              <label key={status.id} className={`status-checkbox category-${status.categoryName.toLowerCase().replace(/\s+/g, '-')}`}>
                <input
                  type="checkbox"
                  checked={selectedStatuses.has(status.id)}
                  onChange={() => toggleStatus(status.id)}
                />
                <span>{status.name}</span>
                <span className="status-category-badge">{status.categoryName}</span>
              </label>
            ))}
          </div>
          <div className="status-quick-actions">
            <button
              className="status-action-btn"
              onClick={() => setSelectedStatuses(new Set(availableStatuses.map(s => s.id)))}
            >
              Vel alle
            </button>
            <button
              className="status-action-btn"
              onClick={() => setSelectedStatuses(new Set())}
            >
              Fjern alle
            </button>
          </div>
        </div>
      )}

      {!isDemo && assignees.length > 0 && (
        <div className="assignee-filter">
          <span className="filter-label">Filtrer etter utviklar:</span>
          <div className="assignee-checkboxes">
            {assignees.map(assignee => (
              <label key={assignee} className="assignee-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAssignees.has(assignee)}
                  onChange={() => toggleAssignee(assignee)}
                />
                <span>{assignee}</span>
              </label>
            ))}
          </div>
          {selectedAssignees.size > 0 && (
            <button 
              className="clear-assignees"
              onClick={() => setSelectedAssignees(new Set())}
            >
              Fjern alle (✕)
            </button>
          )}
        </div>
      )}

      <div className="charts-grid">
        {displayCategories.map(cat => (
          <ChartSection
            key={cat}
            title={DEFAULT_CATEGORIES[cat]?.name || cat.charAt(0).toUpperCase() + cat.slice(1)}
            data={chartDataByCategory[cat] || []}
            colors={CATEGORY_COLORS[cat] || CATEGORY_COLORS.type}
            chartType={chartType}
          />
        ))}
        {prefixFilter && assigneeDataByCategory[prefixFilter]?.length > 0 && (
          <ChartSection
            key={`${prefixFilter}-assignees`}
            title={`Tilordna personar (${DEFAULT_CATEGORIES[prefixFilter]?.name || prefixFilter})`}
            data={assigneeDataByCategory[prefixFilter]}
            colors={['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']}
            chartType={chartType}
          />
        )}
      </div>

    </div>
  );
}

export default function App() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [connectionConfig, setConnectionConfig] = useState(null);
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [currentJql, setCurrentJql] = useState('');

  const fetchJiraStatuses = async ({ host, email, token, project, proxyUrl }) => {
    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jiraHost: host,
          email,
          token,
          path: `/rest/api/3/project/${project}/statuses`,
        }),
      });
      if (!response.ok) return [];
      const data = await response.json();
      const statusMap = new Map();
      (Array.isArray(data) ? data : []).forEach(issueType => {
        (issueType.statuses || []).forEach(status => {
          const id = status.id || status.name;
          if (!statusMap.has(id)) {
            statusMap.set(id, {
              id: id,
              name: status.name,
              categoryName: status.statusCategory?.name || '',
            });
          }
        });
      });
      return Array.from(statusMap.values());
    } catch {
      return [];
    }
  };

  const fetchJiraIssues = async ({ host, email, token, project, proxyUrl, startDate, endDate, createdStartDate, createdEndDate, assignees, domain, selectedStatuses }) => {
    setLoading(true);
    setError(null);

    try {
      let jql = `project = ${project} AND labels IS NOT EMPTY`;
      
      if (selectedStatuses && selectedStatuses.length > 0) {
        const statusList = selectedStatuses.join(', ');
        jql += ` AND status IN (${statusList})`;
      }
      
      if (startDate) {
        jql += ` AND updated >= "${startDate}"`;
      }
      if (endDate) {
        jql += ` AND updated <= "${endDate}"`;
      }
      if (createdStartDate) {
        jql += ` AND created >= "${createdStartDate}"`;
      }
      if (createdEndDate) {
        jql += ` AND created <= "${createdEndDate}"`;
      }
      if (assignees && assignees.length > 0) {
        const assigneeList = assignees.map(a => `"${a}"`).join(', ');
        jql += ` AND assignee IN (${assigneeList})`;
      }
      if (domain) {
        jql += ` AND labels = "${domain}"`;
      }
      
      jql += ` ORDER BY updated DESC`;

      setCurrentJql(jql);

      // Hent alle saker med paginering
      let allIssues = [];
      let nextPageToken = null;
      const maxResults = 100;

      do {
        const requestBody = {
          jql: jql,
          fields: ['key', 'summary', 'labels', 'assignee'],
          maxResults: maxResults,
        };
        if (nextPageToken) {
          requestBody.nextPageToken = nextPageToken;
        }

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jiraHost: host,
            email: email,
            token: token,
            requestBody: requestBody,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error('Feil e-post eller API token');
          } else if (response.status === 404) {
            throw new Error('Fann ikkje prosjektet. Sjekk prosjektnøkkelen.');
          } else if (response.status === 403) {
            throw new Error(errorData.error || 'Tilgang nekta');
          }
          throw new Error(errorData.error || errorData.jiraResponse || `Feil frå proxy: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        const issues = data.issues || [];
        allIssues = allIssues.concat(issues);
        nextPageToken = data.nextPageToken || null;
      } while (nextPageToken);

      const mappedIssues = allIssues.map(issue => ({
        key: issue.key,
        summary: issue.fields?.summary || '',
        labels: issue.fields?.labels || [],
        assignee: issue.fields?.assignee?.displayName || issue.fields?.assignee?.name || null,
      }));

      setIssues(mappedIssues);
      setConnected(true);
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Kunne ikkje nå proxy. Sjekk at Cloudflare Worker URL er korrekt.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (config) => {
    if (config.demo) {
      setIssues(DEMO_ISSUES);
      setIsDemo(true);
      setConnected(true);
      return;
    }
    setIsDemo(false);
    setConnectionConfig(config);

    // Hent tilgjengelege statusar for prosjektet
    const statuses = await fetchJiraStatuses(config);
    setAvailableStatuses(statuses);

    // Standard: vel alle statusar
    const defaultSelected = statuses.map(s => s.id);

    // Les lagra datoar frå localStorage
    const startDate = localStorage.getItem('jira_start_date') || '';
    const endDate = localStorage.getItem('jira_end_date') || '';
    const createdStartDate = localStorage.getItem('jira_created_start_date') || '';
    const createdEndDate = localStorage.getItem('jira_created_end_date') || '';
    const domain = localStorage.getItem('jira_selected_domain') || '';

    fetchJiraIssues({ ...config, selectedStatuses: defaultSelected, startDate, endDate, createdStartDate, createdEndDate, domain });
  };

  const handleRefresh = async (startDate, endDate, createdStartDate, createdEndDate, assignees, domain, selectedStatuses) => {
    if (connectionConfig) {
      await fetchJiraIssues({ ...connectionConfig, startDate, endDate, createdStartDate, createdEndDate, assignees, domain, selectedStatuses });
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setIssues([]);
    setIsDemo(false);
  };

  // Sjekk URL-parametrar ved oppstart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      handleConnect({ demo: true });
    }
  }, []);

  return (
    <div className="app">
      {!connected ? (
        <>
          <SetupForm onConnect={handleConnect} loading={loading} />
          {error && (
            <div className="error-toast">
              <span>⚠️</span>
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}
        </>
      ) : (
        <Dashboard issues={issues} onDisconnect={handleDisconnect} isDemo={isDemo} onRefresh={handleRefresh} availableStatuses={availableStatuses} currentJql={currentJql} />
      )}
    </div>
  );
}
