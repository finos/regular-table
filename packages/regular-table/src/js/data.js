import Papa from 'papaparse';

export class DataModel {
    to_columns(idx_2d) {
        return this.get_data_slice(idx_2d);
    }

    get_data_slice({start_row, end_row, start_col, end_col}) {
        throw new TypeError("Must override method");
    }
}

export class CsvDataModel extends DataModel {
    constructor(csv, opt={}) {
        super();
        this.cols = [];

        let {data} = Papa.parse(csv, opt);
        let paths = data.shift();
        for (let i=0; i<paths.length; i++) {
            let val = [];
            for (let j=0; j<data.length; j++) {
                val.push(data[i][j]);
            }

            this.cols.push({
                cidx: i,
                paths: paths[i],
                val
            });
        }
    }

    get_data_slice({start_row, end_row, start_col, end_col}) {
        let cols = [];

        for (let i=start_col; i<end_col; i++) {
            cols.push({
                cidx: this.cols[i].cidx,
                paths: this.cols[i].paths,
                val: this.cols[i].val.slice(start_row, end_row)
            });
        }

        return cols;
    }
}
