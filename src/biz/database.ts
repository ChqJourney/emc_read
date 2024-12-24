import Database from '@tauri-apps/plugin-sql';
import { writable } from 'svelte/store';
import type { Reservation, ReservationDTO, Station, StationDTO, Test, TestDTO, Visting, VistingDTO } from '../types/interfaces';
import { generateLargeAmountReservationData, generateLargeAmountStationData, generateLargeAmountVistingData } from './seedData';
import { BaseDirectory, readTextFile } from '@tauri-apps/plugin-fs';

// 创建一个可写的 store 来存储数据库连接
const db = writable<Database | null>(null);

// 初始化数据库连接
async function initDatabase() {
    const settingsStr = await readTextFile("settings.json", { baseDir: BaseDirectory.AppData });
    const setting = JSON.parse(settingsStr);
    const remote_source = setting["remote_source"];
    console.log(remote_source);
    if (!remote_source || remote_source.trim() === "") {
        throw new Error("未设置远程数据源");
    }
    const dbString = `sqlite:${remote_source}data\\data.db?mode=rwc&cache=private`;
    // let connection_string=await invoke('get_db_connection_string');
    try {
        const database = await Database.load(dbString);
        db.set(database);

        // 检查是否需要填充数据
        await seedDataIfNeeded(database);

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

// 添加数据填充函数
async function seedDataIfNeeded(database: Database) {
    // const isDev = import.meta.env.DEV;
    // if (!isDev) return;
    // 检查是否已经有数据
    const stations = await repository.getAllStations();
    if (stations.length === 0) {
        // 填充工位数据
        const defaultStations: StationDTO[] = await generateLargeAmountStationData();

        for (const station of defaultStations) {
            await repository.createStation(station as Station);
        }

        // 填充一些示例预约数据
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sampleReservations: ReservationDTO[] = await generateLargeAmountReservationData();

        for (const reservation of sampleReservations) {
            await repository.createReservation(reservation as Reservation);
        }
        // 填充一些示例访问记录数据
        const sampleVistings: VistingDTO[] = await generateLargeAmountVistingData();
        for (const visting of sampleVistings) {
            await repository.createVisting(visting as Visting);
        }
    }
}

// 创建 Repository 类
class Repository {
    private static instance: Repository;

    private constructor() {
        initDatabase();
        // 添加窗口关闭事件监听器
        window.addEventListener('beforeunload', async () => {
            const database = await this.getDb();
            await database.close();
        });
    }

    public static getInstance(): Repository {
        if (!Repository.instance) {
            Repository.instance = new Repository();
        }
        return Repository.instance;
    }

    // 获取数据库实例
    async getDb(): Promise<Database> {
        return new Promise((resolve, reject) => {
            db.subscribe(value => {
                if (value) {
                    resolve(value);
                }
            });
        });
    }

    // 示例：获取预约列表
    async getReservationsByDate(date: string): Promise<Reservation[]> {
        const database = await this.getDb();

        // console.log(database)
        return await database.select(
            'SELECT * FROM reservations WHERE reservation_date = $1',
            [date]
        );
    }
    async getReservationsByMonth(month: string): Promise<Reservation[]> {
        const database = await this.getDb();
        const startDate = `${month}-01`;
        const [year, monthStr] = month.split('-');
        const lastDay = new Date(Number(year), Number(monthStr), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;
        console.log(`SELECT * FROM reservations WHERE reservation_date>='${startDate}' AND reservation_date<='${endDate}'`);
        return await database.select(`SELECT * FROM reservations WHERE reservation_date>='${startDate}' AND reservation_date<='${endDate}' order by reservation_date desc`);
    }
    async getReservationsByYear(year: string): Promise<Reservation[]> {
        const database = await this.getDb();
        return await database.select(`SELECT * FROM reservations WHERE reservation_date>='${year}-01-01' AND reservation_date<='${year}-12-31' order by reservation_date desc`);
    }
    async getAllReservations(timeRange: string): Promise<Reservation[]> {
        const database = await this.getDb();
        switch (timeRange) {
            case 'month':
                return await this.getReservationsByMonth(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
            case 'year':
                return await this.getReservationsByYear(new Date().getFullYear().toString());
            case 'all':
                return await database.select('SELECT * FROM reservations order by reservation_date desc');
            default:
                return [];
        }
    }

    // 示例：创建预约
    async createReservation(reservation: ReservationDTO) {
        const database = await this.getDb();
        return await database.execute(
            `INSERT INTO reservations(
                reservation_date,
                time_slot,
                station_id,
                client_name,
                product_name,
                tests,
                job_no,
                project_engineer,
                testing_engineer,
                purpose_description,
                contact_name,
                contact_phone,
                sales,
                reservate_by,
                reservation_status
         ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                reservation.reservation_date,
                reservation.time_slot,
                reservation.station_id,
                reservation.client_name,
                reservation.product_name,
                reservation.tests,
                reservation.job_no,
                reservation.project_engineer,
                reservation.testing_engineer,
                reservation.purpose_description,
                reservation.contact_name,
                reservation.contact_phone,
                reservation.sales,
                reservation.reservate_by,
                reservation.reservation_status
            ]
        );
    }
    //更新预约
    async updateReservation(reservation: Reservation) {
        const database = await this.getDb();
        return await database.execute(
            `UPDATE reservations SET 
            reservation_date=$1,
            time_slot=$2,
            station_id=$3, 
            client_name=$4,
            product_name=$5,
            contact_name=$6,
            contact_phone=$7,
            tests=$8,
            job_no=$9,
            purpose_description=$10,
            sales=$11,
            project_engineer=$12,
            testing_engineer=$13,
            reservate_by=$14,
            reservation_status=$15 WHERE id=$16`, [
                reservation.reservation_date, 
                reservation.time_slot, 
                reservation.station_id, 
                reservation.client_name, 
                reservation.product_name, 
                reservation.contact_name, 
                reservation.contact_phone, 
                reservation.tests, 
                reservation.job_no, 
                reservation.purpose_description, 
                reservation.sales, 
                reservation.project_engineer, 
                reservation.testing_engineer, 
                reservation.reservate_by, 
                reservation.reservation_status, 
                reservation.id
            ]);
    }
    async deleteReservation(id: number) {
        const database = await this.getDb();
        return await database.execute(`DELETE FROM reservations WHERE id=$1`, [id]);
    }
    //查询某日期某工位某时间段的预约,去除status!=normal
    async getReservationsByStationAndTime(date: string, station_id: number, time_slot: string): Promise<Reservation[]> {
        const database = await this.getDb();
        return await database.select('SELECT * FROM reservations WHERE reservation_date=$1 AND station_id=$2 AND time_slot=$3 And RESERVATION_STATUS="normal"', [date, station_id, time_slot]);
    }
    //查询某月某工位的所有预约,去除status!=normal
    async getReservationsByStationAndMonth(month: string, station_id: number): Promise<Reservation[]> {
        const database = await this.getDb();
        const startDate = `${month}-01`;
        const [year, monthStr] = month.split('-');
        const lastDay = new Date(Number(year), Number(monthStr), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}`;
        return await database.select(`SELECT * FROM reservations WHERE station_id=$1 AND reservation_date>='${startDate}' AND reservation_date<='${endDate}' And RESERVATION_STATUS="normal"`, [station_id]);
    }
    //查询工位列表
    async getAllStations(): Promise<Station[]> {
        const database = await this.getDb();
        return await database.select('SELECT * FROM stations order by sequence_no asc,created_on desc');
    }
    async maxStationSeq(): Promise<{ max_no: number }[]> {
        const database = await this.getDb();
        return await database.select('SELECT MAX(sequence_no) as max_no FROM stations');
    }
    async createStation(station: StationDTO) {
        const database = await this.getDb();
        return await database.execute(
            `INSERT INTO stations(name,short_name,description,photo_path,status,sequence_no) VALUES($1, $2, $3, $4, $5,$6)`,
            [station.name, station.short_name, station.description, station.photo_path, station.status, station.sequence_no]
        );
    }
    async updateStation(station: Station) {
        const database = await this.getDb();
        return await database.execute(
            `UPDATE stations SET name=$1,short_name=$2,description=$3,photo_path=$4,status=$5,sequence_no=$6 WHERE id=$7`,
            [station.name, station.short_name, station.description, station.photo_path, station.status, station.sequence_no, station.id]
        );
    }
    async getStationNameById(id: number): Promise<string> {
        const database = await this.getDb();
        const result: { name: string }[] = await database.select('SELECT name FROM stations WHERE id=$1', [id]);
        return result[0]?.name || '';
    }
    async getStationById(id: number): Promise<Station[]> {
        const database = await this.getDb();
        return await database.select('SELECT * FROM stations WHERE id=$1', [id]);
    }
    async deleteStation(id: number) {
        const database = await this.getDb();
        return await database.execute(`DELETE FROM stations WHERE id=$1`, [id]);
    }

    // sqls for visitings
    async getAllVistings(timeRange: string): Promise<Visting[]> {
        const database = await this.getDb();
        switch (timeRange) {
            case 'month':
                return await this.getVistingsByMonth(`${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
            case 'year':
                return await this.getVistingsByYear(new Date().getFullYear().toString());
            case 'all':
                return await database.select('SELECT * FROM visitings order by last_visit_time desc');
            default:
                return [];
        }
    }
    async getVistingsByMonth(month: string): Promise<Visting[]> {
        const database = await this.getDb();
        return await database.select(`SELECT * FROM visitings WHERE last_visit_time>='${month}-01' AND last_visit_time<='${month}-31'`);
    }
    async getVistingsByYear(year: string): Promise<Visting[]> {
        const database = await this.getDb();
        return await database.select(`SELECT * FROM visitings WHERE last_visit_time>='${year}-01-01' AND last_visit_time<='${year}-12-31'`);
    }
    async createVisting(visting: VistingDTO) {
        const database = await this.getDb();
        return await database.execute(`INSERT INTO visitings(visit_user,visit_machine,visit_count) VALUES($1,$2,$3)`, [visting.visit_user, visting.visit_machine, visting.visit_count]);
    }
    async getVistingByUserAndMachine(user: string, machine: string): Promise<Visting[]> {
        const database = await this.getDb();
        return await database.select('SELECT * FROM visitings WHERE visit_user=$1 AND visit_machine=$2', [user, machine]);
    }
    async updateVisting(visting: Visting) {
        const database = await this.getDb();
        return await database.execute(`UPDATE visitings SET visit_count=$1 WHERE id=$2`, [visting.visit_count, visting.id]);
    }
    async deleteVisiting(id: number) {
        const database = await this.getDb();
        return await database.execute(`DELETE FROM visitings WHERE id=$1`, [id]);
    }


    // sqls for tests
    async getAllTests(): Promise<Test[]> {
        const database = await this.getDb();
        return await database.select('SELECT * FROM tests order by sequence_no asc,created_on desc');
    }
    async maxTestSeq(): Promise<{ max_no: number }[]> {
        const database = await this.getDb();
        return await database.select('SELECT MAX(sequence_no) as max_no FROM tests');
    }
    async createTest(test: TestDTO) {
        const database = await this.getDb();
        return await database.execute(`INSERT INTO tests(name,short_name,description,sequence_no) VALUES($1,$2,$3,$4)`, [test.name, test.short_name, test.description, test.sequence_no]);
    }
    async deleteTest(id: number) {
        const database = await this.getDb();
        return await database.execute(`DELETE FROM tests WHERE id=$1`, [id]);
    }
    async updateTest(test: Test) {
        const database = await this.getDb();
        return await database.execute(`UPDATE tests SET name=$1,short_name=$2,description=$3,sequence_no=$4 WHERE id=$5`, [test.name, test.short_name, test.description, test.sequence_no, test.id]);
    }
    // 添加关闭数据库的方法
    async closeDatabase() {
        const database = await this.getDb();
        await database.close();
        db.set(null);
    }
    async insertStationTransaction(station: Station) {
        const database = await this.getDb();
        const maxNoResult: { max_no: number }[] = await database.select('SELECT MAX(sequence_no) as max_no FROM stations');
        const maxNo = maxNoResult[0]?.max_no || 0;
        let sql = 'begin transaction;';
        for (let i = maxNo; i >= station.sequence_no; i--) {
            sql += `update stations set sequence_no=${i + 1} where sequence_no=${i};`;
        }
        sql += `INSERT INTO stations(name,short_name,description,photo_path,status,sequence_no) VALUES($1,$2,$3,$4,$5,$6);`;
        sql += `commit;`;
        console.log(sql);
        await database.execute(sql, [station.name, station.short_name, station.description, station.photo_path, station.status, station.sequence_no]);
    }
    async insertTestTransaction(test: Test) {
        const database = await this.getDb();
        const maxNoResult: { max_no: number }[] = await database.select('SELECT MAX(sequence_no) as max_no FROM tests');
        const maxNo = maxNoResult[0]?.max_no || 0;
        let sql = 'begin transaction;';
        for (let i = maxNo; i >= test.sequence_no; i--) {
            sql += `update tests set sequence_no=${i + 1} where sequence_no=${i};`;
        }
        sql += `INSERT INTO tests(name,short_name,description,sequence_no) VALUES($1,$2,$3,$4);`;
        sql += `commit;`;
        console.log(sql);
        await database.execute(sql, [test.name, test.short_name, test.description, test.sequence_no]);
    }
}

export const repository = Repository.getInstance();