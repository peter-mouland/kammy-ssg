/* eslint-env jest */
import sortColumns from './sort-columns';

describe('field-sorter', () => {
  describe('without overrides', () => {
    it('should sort by a single field', () => {
      const arr = [
        { name: 'z' }, { name: 'x' }, { name: 'a' },
      ];
      expect(arr.sort(sortColumns(['name']))).toEqual([
        { name: 'a' }, { name: 'x' }, { name: 'z' },
      ]);
    });

    it('should sort by a single field preserving original data order', () => {
      const arr = [
        { name: 'z', surname: 'zxy' }, { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ];
      expect(arr.sort(sortColumns(['name']))).toEqual([
        { name: 'a', surname: 'b' },
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
      ]);
    });

    it('should sort by multiple fields', () => {
      const arr = [
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ];
      expect(arr.sort(sortColumns(['name', 'surname']))).toEqual([
        { name: 'a', surname: 'b' },
        { name: 'z', surname: 'abc' },
        { name: 'z', surname: 'zxy' },
      ]);
    });

    it('should sort by a sub-field preserving original array order', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename']))).toEqual([
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
      ]);
    });

    it('should sort by multiple sub-fields', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname']))).toEqual([
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'z', surname: 'zxy' } },
      ]);
    });

    it('should sort by multiple sub-fields with null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname']))).toEqual([
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
      ]);
    });

    it('should sort by multiple sub-fields with more null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname']))).toEqual([
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
      ]);
    });

    it('should sort by multiple sub-fields with more null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: null, surname: null } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname']))).toEqual([
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: null, surname: null } },
      ]);
    });
  });

  describe('with overrides will order the overridden column with the supplied order', () => {
    it('should sort by a single field', () => {
      const arr = [
        { name: 'z' }, { name: 'x' }, { name: 'a' },
      ];
      expect(arr.sort(sortColumns(['name'], { name: ['x', 'z', 'a'] }))).toEqual([
        { name: 'x' }, { name: 'z' }, { name: 'a' },
      ]);
    });

    it('should sort by a single field preserving original data order', () => {
      const arr = [
        { name: 'z', surname: 'zxy' }, { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ];
      expect(arr.sort(sortColumns(['name'], { name: ['x', 'z', 'a'] }))).toEqual([
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ]);
    });

    it('should sort by multiple fields', () => {
      const arr = [
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ];
      expect(arr.sort(sortColumns(['name', 'surname'], { name: ['x', 'z', 'a'] }))).toEqual([
        { name: 'z', surname: 'abc' },
        { name: 'z', surname: 'zxy' },
        { name: 'a', surname: 'b' },
      ]);
    });

    it('should sort by multiple fields and override both', () => {
      const arr = [
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ];
      expect(arr.sort(sortColumns(['name', 'surname'], { name: ['x', 'z', 'a'], surname: ['zxy', 'abc'] }))).toEqual([
        { name: 'z', surname: 'zxy' },
        { name: 'z', surname: 'abc' },
        { name: 'a', surname: 'b' },
      ]);
    });

    it('should sort by a sub-field preserving original array order', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename'], { 'name.forename': ['x', 'z', 'a'] }))).toEqual([
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ]);
    });

    it('should sort by multiple sub-fields', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['x', 'z', 'a'] }))).toEqual([
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'b' } },
      ]);
    });

    it('should sort by multiple sub-fields with multiple overrides', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['x', 'z', 'a'], 'name.surname': ['b', 'zxy', 'abc'] }))).toEqual([
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: 'abc' } },
        { name: { forename: 'a', surname: 'b' } },
      ]);
    });

    it('should sort by multiple sub-fields with null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['x', 'z', 'a'] }))).toEqual([
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'b' } },
      ]);
    });

    it('should sort by multiple sub-fields with more null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['x', 'z', 'a'] }))).toEqual([
        { name: { forename: 'z', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'a', surname: 'b' } },
      ]);
    });

    it('should sort by multiple sub-fields with a missing overrides coming last', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'x', surname: 'b' } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['a'] }))).toEqual([
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'x', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
      ]);
    });

    it('should sort by multiple sub-fields with more null values', () => {
      const arr = [
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: null, surname: null } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: 'z', surname: 'b' } },
      ];
      expect(arr.sort(sortColumns(['name.forename', 'name.surname'], { 'name.forename': ['x', 'z', 'a'] }))).toEqual([
        { name: { forename: 'z', surname: 'b' } },
        { name: { forename: 'z', surname: 'zxy' } },
        { name: { forename: 'z', surname: null } },
        { name: { forename: 'a', surname: 'a' } },
        { name: { forename: 'a', surname: 'b' } },
        { name: { forename: null, surname: null } },
      ]);
    });
  });
});
