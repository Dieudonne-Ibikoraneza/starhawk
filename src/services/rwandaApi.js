import { API_BASE_URL } from '@/config/api';

const BASE_URL = API_BASE_URL;
let treePromise = null;

function buildUrl(endpoint) {
  return new URL(`${BASE_URL}${endpoint}`).toString();
}

function normalizeText(value) {
  return `${value || ''}`
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeProvince(value) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (normalized.includes('kigali')) return 'kigali';
  if (normalized.includes('east')) return 'east';
  if (normalized.includes('west')) return 'west';
  if (normalized.includes('north')) return 'north';
  if (normalized.includes('south')) return 'south';
  return normalized;
}

function unwrapTree(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.provinces)) {
    return data.provinces;
  }

  return [];
}

function clone(node) {
  return node ? JSON.parse(JSON.stringify(node)) : node;
}

function matches(node, query) {
  if (!query) return true;
  const q = normalizeText(query);
  return (
    normalizeText(node.id).includes(q) ||
    normalizeText(node.slug).includes(q) ||
    normalizeText(node.name).includes(q)
  );
}

function findProvince(tree, provinceId) {
  const key = normalizeProvince(provinceId);
  return tree.find((province) => normalizeText(province.slug) === key || normalizeText(province.id) === key || matches(province, key));
}

function findDistrict(tree, districtId, provinceId) {
  const provinces = provinceId ? [findProvince(tree, provinceId)].filter(Boolean) : tree;
  const q = normalizeText(districtId);
  for (const province of provinces) {
    const district = (province.children || []).find((item) => {
      const slug = normalizeText(item.slug);
      return slug === q || normalizeText(item.id) === q || matches(item, q);
    });
    if (district) return district;
  }
  return null;
}

function findSector(tree, sectorId, districtId, provinceId) {
  const districts = [];
  const provinces = provinceId ? [findProvince(tree, provinceId)].filter(Boolean) : tree;
  for (const province of provinces) {
    if (districtId) {
      const district = (province.children || []).find((item) => normalizeText(item.slug) === normalizeText(districtId) || normalizeText(item.id) === normalizeText(districtId) || matches(item, districtId));
      if (district) {
        districts.push(district);
      }
    } else {
      districts.push(...(province.children || []));
    }
  }

  const q = normalizeText(sectorId);
  for (const district of districts) {
    const sector = (district.children || []).find((item) => normalizeText(item.slug) === q || normalizeText(item.id) === q || matches(item, q));
    if (sector) return sector;
  }
  return null;
}

function listChildren(nodes, query) {
  return (nodes || []).filter((node) => matches(node, query)).map(clone);
}

class RwandaApiService {
  async loadTree() {
    if (!treePromise) {
      treePromise = fetch(buildUrl('/tree'), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return unwrapTree(data);
        })
        .catch((error) => {
          treePromise = null;
          throw error;
        });
    }

    return treePromise;
  }

  async getProvinces() {
    const tree = await this.loadTree();
    return tree.map(clone);
  }

  async getDistricts(provinceId, query = undefined) {
    const tree = await this.loadTree();
    const province = findProvince(tree, provinceId);
    return listChildren(province?.children, query);
  }

  async getSectors(districtId, provinceId = undefined, query = undefined) {
    const tree = await this.loadTree();
    const district = findDistrict(tree, districtId, provinceId);
    return listChildren(district?.children, query);
  }

  async getVillages(sectorId, districtId = undefined, provinceId = undefined, query = undefined) {
    const tree = await this.loadTree();
    const sector = findSector(tree, sectorId, districtId, provinceId);
    return listChildren(sector?.children, query);
  }

  async getCells(villageId, sectorId = undefined, districtId = undefined, provinceId = undefined, query = undefined) {
    const tree = await this.loadTree();
    const sector = findSector(tree, sectorId, districtId, provinceId);
    const village = (sector?.children || []).find((item) => normalizeText(item.slug) === normalizeText(villageId) || normalizeText(item.id) === normalizeText(villageId) || matches(item, villageId));
    return listChildren(village?.children, query);
  }

  async getLocationHierarchy(provinceId, districtId, sectorId, villageId) {
    const [provinces, districts, sectors, villages, cells] = await Promise.all([
      this.getProvinces(),
      provinceId ? this.getDistricts(provinceId) : Promise.resolve([]),
      districtId ? this.getSectors(districtId, provinceId) : Promise.resolve([]),
      sectorId ? this.getVillages(sectorId, districtId, provinceId) : Promise.resolve([]),
      villageId ? this.getCells(villageId, sectorId, districtId, provinceId) : Promise.resolve([]),
    ]);

    return { provinces, districts, sectors, villages, cells };
  }

  async searchLocations(query, type = 'all') {
    const normalized = `${query || ''}`.trim();
    if (!normalized) {
      return [];
    }

    const tree = await this.loadTree();
    const results = [];

    const addResults = (items, level) => {
      items.filter((item) => matches(item, normalized)).forEach((item) => {
        results.push({ ...clone(item), type: level });
      });
    };

    if (type === 'all' || type === 'provinces') addResults(tree, 'province');
    if (type === 'all' || type === 'districts') tree.forEach((p) => addResults(p.children || [], 'district'));
    if (type === 'all' || type === 'sectors') tree.forEach((p) => (p.children || []).forEach((d) => addResults(d.children || [], 'sector')));
    if (type === 'all' || type === 'villages') tree.forEach((p) => (p.children || []).forEach((d) => (d.children || []).forEach((s) => addResults(s.children || [], 'village'))));
    if (type === 'all' || type === 'cells') tree.forEach((p) => (p.children || []).forEach((d) => (d.children || []).forEach((s) => (s.children || []).forEach((v) => addResults(v.children || [], 'cell')))));

    const seen = new Set();
    return results.filter((item) => {
      const key = `${item.type}:${item.id || item.slug || item.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async getLocationByCoordinates(latitude, longitude) {
    const searchResults = await this.searchLocations(`${latitude},${longitude}`);
    return searchResults[0] || null;
  }
}

const rwandaApiService = new RwandaApiService();
export default rwandaApiService;
