import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const CA_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
];

export default function TaxSettings() {
  const [settings, setSettings] = useState({
    country: 'US',
    state: null,
    province: null,
    defaultTaxRate: 0,
    taxId: '',
    businessType: 'sole_proprietor',
    fiscalYearEnd: '12-31',
    weeklyDeductionScan: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings();
    fetchRules();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/tax/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await api.get('/tax/deduction-rules');
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/tax/settings', settings);
      alert('Settings saved successfully!');
      navigate('/tax-deductions');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tax Settings</h1>
        <button
          onClick={() => navigate('/tax-deductions')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          ← Back to Deductions
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={settings.country}
            onChange={(e) => setSettings({ ...settings, country: e.target.value, state: null, province: null })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
          </select>
        </div>

        {/* State/Province Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {settings.country === 'US' ? 'State' : 'Province'}
          </label>
          <select
            value={settings.country === 'US' ? settings.state : settings.province}
            onChange={(e) => setSettings({
              ...settings,
              [settings.country === 'US' ? 'state' : 'province']: e.target.value
            })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select {settings.country === 'US' ? 'State' : 'Province'}</option>
            {(settings.country === 'US' ? US_STATES : CA_PROVINCES).map(code => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type
          </label>
          <select
            value={settings.businessType}
            onChange={(e) => setSettings({ ...settings, businessType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="sole_proprietor">Sole Proprietor</option>
            <option value="llc">LLC</option>
            <option value="s_corp">S-Corp</option>
            <option value="c_corp">C-Corp</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        {/* Tax ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax ID / EIN {settings.country === 'CA' && '/ Business Number'}
          </label>
          <input
            type="text"
            value={settings.taxId || ''}
            onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
            placeholder={settings.country === 'US' ? 'XX-XXXXXXX' : 'XXXXXXXXX'}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Fiscal Year End */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fiscal Year End
          </label>
          <input
            type="text"
            value={settings.fiscalYearEnd}
            onChange={(e) => setSettings({ ...settings, fiscalYearEnd: e.target.value })}
            placeholder="MM-DD"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">Format: MM-DD (e.g., 12-31 for December 31)</p>
        </div>

        {/* Weekly Scan Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium">Weekly Deduction Scan</div>
            <div className="text-sm text-gray-500">
              Automatically scan for new deductions every Monday
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.weeklyDeductionScan}
              onChange={(e) => setSettings({ ...settings, weeklyDeductionScan: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Deduction Rules Reference */}
      {rules && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Deduction Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(rules).map(([key, rule]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="font-medium">{rule.name}</div>
                <div className="text-sm text-gray-600 mt-1">{rule.notes}</div>
                <div className="text-sm text-blue-600 mt-2">
                  {rule.maxPercentage}% deductible
                  {rule.requiresReceipt && ' • Receipt required'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
