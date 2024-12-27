<script lang="ts">
  import { goto } from "$app/navigation";
  import { repository } from "../biz/database";
  import type { Reservation, User } from "../biz/types";
  import { onMount } from "svelte";
  import { calendar } from "../biz/calendar";
  import { invoke } from "@tauri-apps/api/core";
  import { load } from "@tauri-apps/plugin-store";
  import { exists, readTextFile } from "@tauri-apps/plugin-fs";
  import { message, open } from "@tauri-apps/plugin-dialog";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { setGlobal } from "../biz/globalStore";
    import { modalStore } from "../components/modalStore";
    import { errorHandler } from "../biz/errorHandler";
  // 使用calendar实例的store
  const currentMonth = calendar.currentMonth;

  // 加载月度预约数据
  async function loadMonthData(): Promise<Reservation[]> {
    const year = parseInt($currentMonth.split("-")[0]);
    const month = parseInt($currentMonth.split("-")[1]);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 获取整月的预约数据
    // monthlyReservations = [];
    const res = await repository.getReservationsByMonth($currentMonth);
    return res;
  }

  // 处理日期点击
  function handleDateClick(date: string) {
    console.log(date);
    goto(`/date?date=${date}`);
  }

  // 计算日历数据

  const daysInMonth = $derived(calendar.getDaysInMonth($currentMonth));
  const firstDayOfMonth = $derived(calendar.getFirstDayOfMonth($currentMonth));
  const calendarDays = $derived(calendar.getCalendarDays($currentMonth));
  const monthDisplay = $derived(calendar.getMonthDisplay($currentMonth));

  async function logVisiting(u: User) {
    console.log(u);
    const vistings = await repository.getVistingByUserAndMachine(
      u.user,
      u.machine,
    );
    console.log(vistings);
    if (vistings.length > 0) {
      console.log("count+1")
      vistings[0].visit_count += 1;
      vistings[0].last_visit_time = new Date().toISOString();
      await repository.updateVisting(vistings[0]);
    } else {
      await repository.createVisting({
        visit_user: u.user,
        visit_machine: u.machine,
        visit_count: 1,
      });
    }
  }
  const sleep = (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };
  const init = async () => {
    const store = await load("settings.json");
    const lastUser: User | undefined = await store.get<User>("user");
    const u: string = await invoke("check_user");
    const currentUser: User = JSON.parse(u);
    // Always update the user data
    await store.set("user", {
      machine: currentUser.machine,
      user: currentUser.user,
    });
    setGlobal("user", { machine: currentUser.machine, user: currentUser.user });
    logVisiting(currentUser);
    
    const remote_source: string | undefined =
      await store.get<string>("remote_source");
    console.log(remote_source);
    let source_valid = false;
    if (remote_source) {
      const dbConnected = await exists(`${remote_source}\\data\\data.db`);
      const settingConnected = await exists(`${remote_source}\\settings.json`);
      console.log(dbConnected, settingConnected);
      if (dbConnected && settingConnected) {
        source_valid = true;
      } else {
        source_valid = false;
      }
    }
    if (!source_valid) {
      const result = await open({
        title: "选择远程数据源",
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
    const station_order: {id:number,seq:number}[] | undefined = await store.get<{id:number,seq:number}[]>("station_orders");
    if (station_order) {
      setGlobal("station_orders", station_order);
    }
    setGlobal("tests", config.tests || []);
    setGlobal("project_engineers", config.project_engineers || []);
    setGlobal("testing_engineers", config.testing_engineers || []);
    setGlobal("loadSetting", config.loadSetting || {});
    // await store.set("tests", config.tests || []);
    // await store.set("project_engineers", config.project_engineers || []);
    // await store.set("testing_engineers", config.testing_engineers || []);
    await store.set("loadSetting", config.loadSetting || {});
  };
  // Add keyboard event listener for month navigation
  const handleKeydown = (event: KeyboardEvent) => {
    
    if (event.key === "ArrowLeft") {
      calendar.changeMonth(-1);
    } else if (event.key === "ArrowRight") {
      calendar.changeMonth(1);
    }
  };
  onMount(() => {
    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });
 
</script>

<div class="page-container">
  {#await init()}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>
  {:then _}
    <div class="fixed-header">
      <button
        aria-label="today"
        class="tooltip-container"
        onclick={() => handleDateClick(new Date().toISOString().split("T")[0])}
      >
        <span class="tooltip">返回今天</span>
        <svg
          class="logo"
          style="fill: #fbc400;"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          ><path
            d="M810.653961 127.994116l-42.664705 0L767.989255 42.664705l-85.329411 0 0 85.329411L341.340155 127.994116 341.340155 42.664705l-85.329411 0 0 85.329411-42.664705 0c-47.14474 0-84.902692 38.184671-84.902692 85.329411l-0.426719 597.307921c0 47.14474 38.184671 85.329411 85.329411 85.329411l597.307921 0c47.14474 0 85.329411-38.184671 85.329411-85.329411L895.983371 213.32455C895.983371 166.17981 857.7987 127.994116 810.653961 127.994116zM810.653961 810.632471 213.346039 810.632471 213.346039 341.318666l597.307921 0L810.653961 810.632471zM298.67545 426.6491l213.32455 0 0 213.32455L298.67545 639.97365 298.67545 426.6491z"
          ></path></svg
        >
      </button>
      <!-- <img class="brand" src="/intertek.png" alt="Intertek" /> -->
      <div class="month-nav">
        <button
          class="tooltip-container"
          aria-label="previous_month"
          onclick={() => calendar.changeMonth(-1)}
        >
          <span class="tooltip">上个月</span>
          <svg
            class="logo"
            style="fill: #fbc400;"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            ><path
              d="M629.291 840.832l60.331-60.331-268.501-268.501 268.501-268.501-60.331-60.331-328.832 328.832z"
            ></path></svg
          >
        </button>
        <input
          type="month"
          class="month-input"
          bind:value={$currentMonth}
          onchange={() => loadMonthData()}
        />
        <button
          class="tooltip-container"
          aria-label="next_month"
          onclick={() => calendar.changeMonth(1)}
        >
          <span class="tooltip">下个月</span>
          <svg
            class="logo"
            style="fill: #fbc400;"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            ><path
              d="M689.621 512l-328.832-328.832-60.331 60.331 268.501 268.501-268.501 268.501 60.331 60.331z"
            ></path></svg
          >
        </button>
      </div>
      <button
        class="tooltip-container"
        onclick={() => goto("/settings")}
        aria-label="settings"
      >
        <span class="tooltip">设置</span>
        <svg
          class="logo"
          style="fill: #fbc400;"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          ><path
            d="M899.2 379.2a439.68 439.68 0 0 0-19.52-47.04 137.28 137.28 0 0 0-187.84-187.84 439.68 439.68 0 0 0-47.04-19.52 137.28 137.28 0 0 0-265.6 0 439.68 439.68 0 0 0-47.04 19.52 137.28 137.28 0 0 0-187.84 187.84 439.68 439.68 0 0 0-19.52 47.04 137.28 137.28 0 0 0 0 265.6 439.68 439.68 0 0 0 19.52 47.04 137.28 137.28 0 0 0 187.84 187.84 439.68 439.68 0 0 0 47.04 19.52 137.28 137.28 0 0 0 265.6 0 439.68 439.68 0 0 0 47.04-19.52 137.28 137.28 0 0 0 187.84-187.84 439.68 439.68 0 0 0 19.52-47.04 137.28 137.28 0 0 0 0-265.6z m-33.6 186.88a41.6 41.6 0 0 0-38.72 32 314.24 314.24 0 0 1-32 77.76 41.92 41.92 0 0 0 5.12 48A54.08 54.08 0 0 1 723.84 800a41.92 41.92 0 0 0-49.28-5.76 314.24 314.24 0 0 1-77.76 32 41.6 41.6 0 0 0-32 38.72 54.08 54.08 0 0 1-108.16 0 41.6 41.6 0 0 0-32-38.72 314.24 314.24 0 0 1-77.76-32 43.84 43.84 0 0 0-20.8-5.44 42.24 42.24 0 0 0-28.48 11.2A54.08 54.08 0 0 1 224 723.84a41.92 41.92 0 0 0 5.76-49.28 314.24 314.24 0 0 1-32-77.76 41.6 41.6 0 0 0-38.72-32 54.08 54.08 0 0 1 0-108.16 41.6 41.6 0 0 0 38.72-32 314.24 314.24 0 0 1 32-77.76A41.92 41.92 0 0 0 224 300.16 54.08 54.08 0 0 1 300.16 224a41.92 41.92 0 0 0 49.28 5.76 314.24 314.24 0 0 1 77.76-32 41.6 41.6 0 0 0 32-38.72 54.08 54.08 0 0 1 108.16 0 41.6 41.6 0 0 0 32 38.72 314.24 314.24 0 0 1 77.76 32A41.92 41.92 0 0 0 723.84 224 54.08 54.08 0 0 1 800 300.16a41.92 41.92 0 0 0-5.76 49.28 314.24 314.24 0 0 1 32 77.76 41.6 41.6 0 0 0 38.72 32 54.08 54.08 0 0 1 0 108.16z"
          ></path><path
            d="M512 310.4a201.6 201.6 0 1 0 201.6 201.6A201.92 201.92 0 0 0 512 310.4z m0 320a118.4 118.4 0 1 1 118.4-118.4 118.4 118.4 0 0 1-118.4 118.4z"
          ></path></svg
        ></button
      >
    </div>

    <div class="calendar-container">
      {#await loadMonthData()}
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <span class="loading-text">加载中...</span>
        </div>
      {:then monthlyReservations}
        <img src="intertek.png" alt="bg" />
        <div class="calendar">
          <div class="weekdays">
            <div style="text-align: center;">日</div>
            <div style="text-align: center;">一</div>
            <div style="text-align: center;">二</div>
            <div style="text-align: center;">三</div>
            <div style="text-align: center;">四</div>
            <div style="text-align: center;">五</div>
            <div style="text-align: center;">六</div>
          </div>

          <div class="days">
            {#each Array(firstDayOfMonth) as _, index}
              {@const prevMonthDay =
                calendar.getPreviousMonthDays($currentMonth)[index]}
              <div class="day empty other-month">{prevMonthDay}</div>
            {/each}

            {#each calendarDays as day}
              {@const date = `${$currentMonth}-${day.toString().padStart(2, "0")}`}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="day {calendar.isToday(date) ? 'today' : ''}"
                title={`Go to ${date}`}
                style="background-color: {calendar.getDayColor(
                  date,
                  monthlyReservations,
                )}"
                onclick={() => handleDateClick(date)}
              >
                {day}
              </div>
            {/each}

            {#each calendar.getNextMonthDays($currentMonth) as day}
              <div class="day empty other-month">{day}</div>
            {/each}
          </div>
        </div>
      {/await}
    </div>
  {:catch error}
    <div>{"Error: " + error.message}</div>
  {/await}
</div>

<style>
  .month-input::-webkit-calendar-picker-indicator {
    filter: invert(70%) sepia(70%) saturate(1000%) hue-rotate(360deg);
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0px;
  }

  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden; /* 防止出滚动条 */
  }

  .fixed-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background-color: #f8f9fa;
    z-index: 100;
    padding: 1.2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  .tooltip-container {
    position: relative;
  }

  .tooltip {
    position: absolute;
    bottom: -35px;
    left: 50%;
    transform: translateX(-50%) translateY(10px);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.85rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }

  /* 添加小三角形 */
  .tooltip::before {
    content: "";
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background-color: rgba(0, 0, 0, 0.8);
  }

  .tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }
  .fixed-header button {
    background-color: transparent;
    border: none;
    outline: none;
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fixed-header button:hover {
    background-color: rgba(251, 196, 0, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(251, 196, 0, 0.2);
  }
  .fixed-header button:active {
    transform: translateY(0);
    background-color: rgba(251, 196, 0, 0.15);
    box-shadow: 0 1px 2px rgba(251, 196, 0, 0.1);
  }
  .fixed-header button:focus {
    outline: 2px solid rgba(251, 196, 0, 0.3);
    outline-offset: 2px;
  }
  .logo {
    width: 2rem;
    height: 2rem;
  }
  .month-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
  }

  .month-nav button {
    background: none;
    border: 1px solid #e0e0e0;
    padding: 4px 4px;
    border-radius: 6px;
    color: #666;
    transition: all 0.3s ease;
  }

  .month-nav button:hover {
    background-color: #f0f0f0;
    color: #333;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .month-nav input {
    padding: 6px 10px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    color: #94a3b8;
    font-size: 1rem;
    min-width: 150px;
    font-family: Arial, Helvetica, sans-serif;
    height: 2rem;
    transition: all 0.3s ease;
  }

  .month-nav input:hover {
    border-color: #d0d0d0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }

  .month-nav input:focus {
    outline: none;
    border-color: #fbc400;
    box-shadow: 0 0 0 3px rgba(251, 196, 0, 0.1);
  }

  .calendar-container {
    margin-top: 80px; /* 为固定头部留出空间 */
    padding: 0 20px 20px;
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden; /* 防止出现滚动条 */
    height: calc(100vh - 80px); /* 减去顶部导航的高度 */
  }
  .calendar-container > img {
    position: absolute;
    z-index: -10;
    opacity: 0.2;
    border-radius: 3rem;
  }
  .calendar {
    width: min(95vw, 800px); /* 日历最大宽度限制 */
    aspect-ratio: 7/6; /* 保持日历的宽高比 */
    max-height: 95%;
    background-color: white;
    opacity: 0.8;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    padding: 16px;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #fbfbfb;
    padding: 0.8rem 0;
    color: #666;
    font-weight: 500;
  }

  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    background-color: #fbfbfb;
    padding: 2px;
  }

  .day {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: clamp(0.8rem, 1.5vw, 1.2rem);
    cursor: pointer;
    background-color: white;
    transition: all 0.3s ease;
    border-radius: 6px;
    border: 1px solid transparent;
  }

  .day:hover {
    background-color: #f8f9fa;
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
    border-color: #e5e7eb;
    color: #1a1a1a;
  }

  .day:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .day.empty {
    background-color: #fffdf7;
  }

  .today {
    border: 2px solid #9ca3af;
    color: #4b5563;
    font-weight: 900;
  }

  .other-month {
    color: #bbb;
    background-color: #fafafa !important;
  }

  .other-month:hover {
    transform: none;
    box-shadow: none;
    background-color: #fafafa !important;
    border-color: transparent;
  }

  /* 确保页面根元素也不会出现滚动条 */
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  :global(html) {
    overflow: hidden;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #fbc400;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }

  .loading-text {
    color: #666;
    font-size: 14px;
    font-family: Arial, sans-serif;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
