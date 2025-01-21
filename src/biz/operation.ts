import type { AppError } from "./errors";
import type { Authorization, Reservation, ReservationDTO, Station, User } from "../types/interfaces";
import { repository } from "./database";
import { errorHandler } from "./errorHandler";
import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import { getGlobal, setGlobal } from "./globalStore";
import { load, Store } from "@tauri-apps/plugin-store";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export const init = async () => {
  const store = await load("settings.json");
  // const lastUser: User | undefined = await store.get<User>("user");
  const u: string = await invoke("check_user");
  const currentUser: User = JSON.parse(u);
  // Always update the user data
  await store.set("user", {
    machine: currentUser.machine,
    user: currentUser.user
  });
  setGlobal("user", {
    machine: currentUser.machine,
    user: currentUser.user
  });

  const remote_source: string | undefined =
    await store.get<string>("remote_source");
  console.log(remote_source);
  let source_valid = false;
  if (remote_source) {
    const dbConnected = await exists(`${remote_source}\\data\\data.db`);
    const settingConnected = await exists(`${remote_source}\\settings.json`);
    const authConnected = await exists(`${remote_source}\\auth.json`);
    console.log(dbConnected, settingConnected);
    if (dbConnected && settingConnected && authConnected) {
      source_valid = true;
    } else {
      source_valid = false;
      errorHandler.showWarning(
        "远程数据源不可用,无法使用本软件，请重新设置远程数据源，然后重启软件")
    }
  }
  if (!source_valid) {
    const init_result = await confirm("远程数据源当前不可用，或未设置，请选择远程数据源或退出", {
      title: "远程数据源不可用",
      kind: "warning"
    });
    if (!init_result) {
      await message("没有选择远程数据源或者远程数据源暂时不可用,无法使用本软件，软件将退出！");
      const window = await getCurrentWindow();
      await window.close();
      return;
    }
    const result = await open({
      title: "请选择远程数据源",
      directory: true,
    });
    if (result) {
      await store.set("remote_source", result);
      await message("已设置远程数据源,请重启软件已生效！");
    } else {
      await message("没有选择远程数据源或者远程数据源暂时不可用,无法使用本软件，软件将退出！");
    }
    const window = await getCurrentWindow();
    await window.close();
    return;
  }
  setGlobal("remote_source", remote_source);
  console.log("source valid");
  const settings = await readTextFile(`${remote_source}\\settings.json`);
  const config = JSON.parse(settings);
  console.log(config);
  const station_order: { id: number, seq: number }[] | undefined = await store.get<{ id: number, seq: number }[]>("station_orders");
  if (station_order) {
    setGlobal("station_orders", station_order);
  }
  setGlobal("tests", config.tests || []);
  setGlobal("project_engineers", config.project_engineers || []);
  setGlobal("testing_engineers", config.testing_engineers || []);
  setGlobal("loadSetting", config.loadSetting || {});
  await store.set("tests", config.tests || []);
  await store.set("project_engineers", config.project_engineers || []);
  await store.set("testing_engineers", config.testing_engineers || []);
  await store.set("loadSetting", config.loadSetting || {});
//   const encryptedContent = await readTextFile(`${remote_source}\\auth.json`);
//   const authContent: Authorization[] = await AuthUtils.decryptFile(encryptedContent);
//   console.log(authContent);
//   const user = getGlobal("user");
//   const role = authContent?.find((a: Authorization) => a.username === user.user && a.machinename === user.machine)?.role;
//   setGlobal("user", { ...user, role: role ?? "engineer" });
};

export const reservationBlockClickPrecheck = (reservation_date: string, current_user?: User, project_engineer?: string, reservate_by?: string) => {
  //当date转换成日期后，在今天之前，不允许预约。如果正好是今天，允许预约

  const today = new Date().toISOString().split('T')[0];
  // 如果正好是今天，允许预约
  if (reservation_date < today) {
    errorHandler.showWarning("不能创建或修改过去的预约");
    return false;
  }
  if(!current_user){
    return true;
  }
  // 当项目工程师不是当前工程师时，不允许修改预约
  if (reservate_by === current_user?.user) {
    errorHandler.showWarning("该预约由你创建，允许修改");
    return true;
  }
  // 当项目工程师不是当前工程师时，不允许修改预约
  if (project_engineer && (project_engineer !== current_user?.user||reservate_by===current_user?.user)) {
    errorHandler.showWarning("不属于你的预约或不是由你创建，无法修改");
    return false;
  }

  return true;
}
export const recordTestsFrequency = async (currentReservation: Reservation) => {
  try {

    const currentTestFrequency: Record<string, number> = getGlobal("test_frequency");

    const newTestFrequency = currentReservation.tests.split(";").reduce((acc: Record<string, number>, test: string) => {
      return currentTestFrequency ? {
        ...acc,
        [`${currentReservation.station_id}_${test}`]: (currentTestFrequency.hasOwnProperty(`${currentReservation.station_id}_${test}`) ? currentTestFrequency[`${currentReservation.station_id}_${test}`] : 0) + 1,
      } : {
        ...acc,
        [`${currentReservation.station_id}_${test}`]: 1
      };
    }, {});
    setGlobal("test_frequency", { ...currentTestFrequency, ...newTestFrequency });
    const store = await Store.load("settings.json");
    await store.set("test_frequency", { ...currentTestFrequency, ...newTestFrequency });
  } catch (e) {
    errorHandler.handleError(e as AppError);
  }
}
export const getTestFrequency = async (init_tests: string[], station_id: number) => {
  const store = await Store.load("settings.json");
  const testFrequencies = await store.get<Record<string, number>>("test_frequency");
  setGlobal("test_frequency", testFrequencies);
  const freqs = getGlobal("test_frequency");
  console.log(freqs);
  const tests = testFrequencies ? [...init_tests].map(test => { return { name: test, most_used: freqs[`${station_id}_${test}`] ? true : false }; }).sort((a, b) => {
    const freqA = freqs[`${station_id}_${a.name}`] ?? 0;
    const freqB = freqs[`${station_id}_${b.name}`] ?? 0;
    return freqB - freqA;
  }) : [...init_tests].map(test => { return { name: test, most_used: 0 }; });
  return tests;
}

