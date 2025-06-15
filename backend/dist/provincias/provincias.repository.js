import { Provincia } from './provincias.entity.js';
const provincias = [
    new Provincia('01', 'Santa Fe'),
];
export class ProvinciasRepository {
    findAll() {
        return provincias;
    }
    findOne(item) {
        return provincias.find((provincia) => provincia.codProvincia === item.codProvincia);
    }
    add(item) {
        provincias.push(item);
        return item;
    }
    update(item) {
        const provinciaCodx = provincias.findIndex((provincia) => provincia.codProvincia === item.codProvincia);
        if (provinciaCodx !== -1) {
            provincias[provinciaCodx] = { ...provincias[provinciaCodx], ...item };
        }
        return provincias[provinciaCodx];
    }
    delete(item) {
        const provinciaCodx = provincias.findIndex((provincia) => provincia.codProvincia === item.codProvincia);
        if (provinciaCodx !== -1) {
            const deletedProvincias = provincias[provinciaCodx];
            provincias.splice(provinciaCodx, 1);
            return deletedProvincias;
        }
    }
}
//# sourceMappingURL=provincias.repository.js.map