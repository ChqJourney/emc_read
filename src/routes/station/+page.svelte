<script lang="ts">
	import { writable } from "svelte/store";
	import { goto } from "$app/navigation";
	import { calendar } from "../../biz/calendar";
	import type {
		Reservation,
		Station,
	} from "../../biz/types";
	import { onMount } from "svelte";
	import { repository } from "../../biz/database";
    import { modalStore } from "../../components/modalStore";
    import { load } from "@tauri-apps/plugin-store";
    import { convertFileSrc } from "@tauri-apps/api/core";
	import type { PageData } from './$types';
    import { getGlobal } from "../../biz/globalStore";
    import ReservationInfo from "../../components/ReservationInfo.svelte";
    import { errorHandler } from "../../biz/errorHandler";
    import { exists } from "@tauri-apps/plugin-fs";
    import About from "../../components/About.svelte";

	let { data }: { data: PageData } = $props();
	let { stationId }= data;
	console.log(stationId);
	// 使用calendar实例的store
	const currentMonth = calendar.currentMonth;
	let selectedDate = $derived(calendar.selectedDate);
	// 加载月度预约数据
	async function loadMonthData(): Promise<Reservation[]> {
		// 获取整月的预约数据
		const res = await repository.getReservationsByStationAndMonth($currentMonth,parseInt(stationId as string));
		console.log(res)
		return res;
	}

	// 计算日历数据

	const daysInMonth = $derived(calendar.getDaysInMonth($currentMonth));
	const firstDayOfMonth = $derived(
		calendar.getFirstDayOfMonth($currentMonth),
	);
	const calendarDays = $derived(calendar.getCalendarDays($currentMonth));
	const monthDisplay = $derived(calendar.getMonthDisplay($currentMonth));
	const showModal = writable(false);
	async function logVisiting(u:{visit_machine:string,visit_user:string}){
    console.log(u)
    const vistings=await repository.getVistingByUserAndMachine(u.visit_user,u.visit_machine);
    if(vistings.length>0){
      vistings[0].visit_count+=1;
      vistings[0].last_visit_time=new Date().toISOString();
      await repository.updateVisting(vistings[0]);
    }else{
      await repository.createVisting({visit_user:u.visit_user,visit_machine:u.visit_machine,visit_count:1});
    }
  }
	
	
	
	let photoAvailable = $state(false);
	async function loadStationInfo(stationId: string): Promise<Station> {
		console.log(stationId);
		const stationInfos: Station[] = await repository.getStationById(
			parseInt(stationId),
		);
		// console.log(stationInfos);
		photoAvailable = await exists(getPhotoPath(stationInfos[0].photo_path));
		// console.log(photoAvailable);
		return stationInfos[0];
	}

	const handlePhotoPath = (path: string) => {
		return convertFileSrc(getPhotoPath(path));
	};
	const getPhotoPath = (path: string) => {
		if (path.includes(":")) {
			return path;
		} else {
			const remote_source = getGlobal("remote_source");
			// console.log(`${remote_source}\\station_pics\\${path}`);
			return `${remote_source}\\station_pics\\${path}`;
		}
	};
	// Add keyboard event listener for day navigation
	const handleKeydown = (event: KeyboardEvent) => {
		// 如果modal正在显示，且不是在输入框内
		if ($modalStore.show) {
			const target = event.target as HTMLElement;
			const isInput =
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable;

			// 如果不是在输入框内，才阻止默认行为
			if (
				!isInput &&
				(event.key === "ArrowLeft" || event.key === "ArrowRight")
			) {
				event.preventDefault();
			}
			return;
		}

		if (event.key === "ArrowLeft") {
			calendar.changeMonth(-1);
		} else if (event.key === "ArrowRight") {
			calendar.changeMonth(1);
		}
	};
	onMount(() => {
		window.addEventListener("keydown", handleKeydown);
		return () => window.removeEventListener("keydown", handleKeydown);
	});
</script>

<div class="container">
	<!-- 固定的顶部信息 -->
	<header class="station-info">
		<div class="header-content">
			<button
				aria-label="home"
				class="tooltip-container"
				onclick={() => goto(`/date?${$selectedDate}`)}
			>
				<span class="tooltip-bottom">返回工位列表</span>
				<svg
					class="home_svg"
					
					viewBox="0 0 1280 1024"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					width="200"
					height="200"
					><path
						d="M1271.872 986.624c10.944-9.344 17.6-15.04-26.368-198.656-76.288-317.888-378.816-523.008-717.504-553.6V0L0 410.048l528 410.048V585.792c219.52-16.64 412.352 2.496 541.44 141.184 63.808 68.48 140.608 204.16 159.04 244.096 2.56 5.632 7.424 16.064 19.008 20.032l14.016 4.48 10.368-8.96z"
					></path></svg
				>
			</button>
			<!-- <img src="/intertek.png" class="brand" alt="logo" /> -->
			{#await loadStationInfo(stationId||"1")}
				<div class="loading-spinner">加载中...</div>
			{:then stationInfo}
				{#if stationInfo}
					<div class="station-details">
						<div class="station-name-container">
							<div class="station-name">
								{stationInfo.name ?? "Unknown"}
							</div>
							<p class="station-description">
								{stationInfo.description ?? "Unknown"}
							</p>
						</div>
						{#if photoAvailable}
							<img
								src={handlePhotoPath(stationInfo.photo_path)}
								class="station-image"
								alt="station_pic"
							/>
						{:else}
							<svg
								class="image-placeholder"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M4 16L8.586 11.414C8.96106 11.0391 9.46967 10.8284 10 10.8284C10.5303 10.8284 11.0389 11.0391 11.414 11.414L16 16M14 14L15.586 12.414C15.9611 12.0391 16.4697 11.8284 17 11.8284C17.5303 11.8284 18.0389 12.0391 18.414 12.414L20 14M14 8H14.01M6 20H18C18.5304 20 19.0391 19.7893 19.4142 19.4142C19.7893 19.0391 20 18.5304 20 18V6C20 5.46957 19.7893 4.96086 19.4142 4.58579C19.0391 4.21071 18.5304 4 18 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20Z"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</div>
				{/if}
			{/await}
			<button
      class="tooltip-container"
      onclick={() => modalStore.open(About, { onNegative: () => modalStore.close() })}
      aria-label="about"
    >
      <span class="tooltip-right">关于</span>
      <svg class="home_svg"
      style="fill: #fbc400;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path d="M512 32C247.04 32 32 247.04 32 512s215.04 480 480 480 480-215.04 480-480S776.96 32 512 32z m58.56 725.76c0 25.92-21.12 47.04-47.04 47.04h-23.52c-25.92 0-47.04-21.12-47.04-47.04V476.96c0-25.92 21.12-47.04 47.04-47.04h23.52c25.92 0 47.04 21.12 47.04 47.04v280.8zM512 359.84c-32.16 0-58.56-26.4-58.56-58.56 0-32.16 26.4-58.56 58.56-58.56s58.56 26.4 58.56 58.56c0 32.16-26.4 58.56-58.56 58.56z"></path></svg>
    
    </button>
		</div>
	</header>

	<!-- 日历部分 -->
	<div class="calendar-container">
		{#await loadMonthData()}
			<div>loading...</div>
		{:then monthlyReservations}
			<div class="month-nav">
				<button
					class="tooltip-container"
					aria-label="previous_month"
					onclick={() => calendar.changeMonth(-1)}
				>
					<span class="tooltip">上个月</span>
					<svg
						class="logo"
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
							class:selectedDay={$selectedDate === date}
							
						>
						{#await new Promise<Reservation[]>(resolve=>resolve(monthlyReservations.filter(f=>f.reservation_date===date))) then reservations}
						<div style="display: flex;flex-direction:column;">
							{#each ["T1", "T2", "T3", "T4", "T5"] as t}
										<div
											onclick={async (e) => {
												
												calendar.setDate(
													date,
												);
												console.log($selectedDate)
												if (
													reservations.filter(
														(f) =>
															f.time_slot === t,
													).length > 0
												) {
													modalStore.open(
														ReservationInfo,
														{
															
															onNegative: () =>
																modalStore.close(),
															reservation:
																reservations.filter(
																	(f) =>
																		f.time_slot ===
																		t,
																)[0],
														},
													);
												} else {
													errorHandler.showInfo("暂无预约")
												}
											}}
											class="slot tooltip-container"
											class:fill_slot={reservations.filter(
												(f) => f.time_slot === t,
											).length > 0}
										>
											{#if reservations.filter((f) => f.time_slot === t).length > 0}<span
													class="tooltip"
													>{reservations.filter(
														(f) =>
															f.time_slot === t,
													)[0]?.client_name}</span
												>{/if}
										</div>
									{/each}
							</div>
						{/await}
							<div class="day_no" style="z-index: 0;">

								{day}
							</div>
						</div>
					{/each}

					{#each calendar.getNextMonthDays($currentMonth) as day}
						<div class="day empty other-month">{day}</div>
					{/each}
				</div>
			</div>
		{/await}
	</div>
	
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: #f0f2f5;
		width: 100%;
	}
	.home_svg {
		fill: #fbc400;
		width: 2rem;
		height: 2rem;
	}
	.station-description{
		font-size: 0.8rem;
		color: #94a3b8;
		font-family: Arial, Helvetica, sans-serif;
		width: 90%;
	}
	.station-info {
		background: white;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-radius: 12px;
		transition: all 0.3s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 0.5rem;
		box-sizing: border-box; /* 确保padding计入总宽度 */
	}
	.station-info button {
		background: none;
		/* border: 1px solid #e0e0e0; */
		border: none;
		outline: none;
		padding: 6px 8px;
		border-radius: 6px;
		color: #666;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.station-info button:hover {
		background-color: rgba(251, 196, 0, 0.1);
		transform: translateY(-2px);
		box-shadow: 0 2px 8px rgba(251, 196, 0, 0.2);
		color: #333;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.logo {
		height: 25px;
		width: 25px;
		fill: #fbc400;
	}
	.brand {
		height: 4rem;
		width: 4rem;
		border-radius: 0.6rem;
	}
	.station-info .header-content {
		/* max-width: 1200px; */
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0.5rem;
	}
	.station-name-container {
		padding: 0 0rem;
	}
	.station-details {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 1200px;
		margin: 0 1rem;
		background:rgb(249, 249, 249);
		border-radius: 12px;
		padding: 0 1rem;
	}
	.station-image {
		width: 120px;
		height: 120px;
		border-radius: 12px;
		margin-right: 4rem;
		fill: #fbc400;
	}
	.image-placeholder {
		width: 100px;
		height: 100px;
		border-radius: 12px;
		margin-right: 4rem;
		stroke: #837e6a;
	}

	.calendar-container {
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow-y: hidden; /* 防止出现滚动条 */
	}
	.tooltip-container {
		position: relative;
		z-index: 50;
	}

	.tooltip {
		position: absolute;
		right:50%;
		bottom: 100%;
		transform: translateX(50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 50;
		margin-bottom: 10px;
	}

	/* 修改小三角形的位置 */
	.tooltip::before {
		content: "";
		position: absolute;
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
		z-index: 50;
	}

	.tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(50%) translateY(0%);
	}
	.tooltip-bottom {
		position: absolute;
		left: -120%;
		top: 100%;
		transform: translateX(50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 50;
		margin-bottom: 10px;
	}
	.tooltip-bottom::before {
		content: "";
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
		z-index: 50;
	}
	.tooltip-container:hover .tooltip-bottom {
		opacity: 1;
		visibility: visible;
		transform: translateX(50%) translateY(0%);
	}
	.tooltip-right {
		position: absolute;
		right: 50%;
		top: 100%;
		transform: translateX(50%);
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 50;
		margin-bottom: 10px;
	}
	.tooltip-right::before {
		content: "";
		position: absolute;
		top: -4px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
		z-index: 50;
	}
	.tooltip-container:hover .tooltip-right {
		opacity: 1;
		visibility: visible;
		transform: translateX(50%) translateY(0%);
	}
	.month-nav {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 2rem;
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
	.month-nav input::-webkit-calendar-picker-indicator {
		filter: invert(70%) sepia(70%) saturate(1000%) hue-rotate(360deg);
		cursor: pointer;
		width: 1.5rem;
		height: 1.5rem;
		padding: 0px;
	}
	.calendar {
		width: min(90vw, 800px); /* 日历最大宽度限制 */
		aspect-ratio: 7/6; /* 保持日历的宽高比 */
		max-height: 90%;
		background-color: white;
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
		position: relative;
	}
	.day_no{
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%,-50%);
		color: #94a3b8;
		font-size: 1.5rem;
		opacity: 0.8;
	}
	.slot{
		font-size: 0.8rem;
		width: 100%;
		min-width: 4rem;
		max-width: 5rem;
		min-height: 0.8rem;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		margin:  2px 0;
		text-align: center;
		opacity: 0.8;
	}
	.fill_slot{
		background-color: #bc42b0;
	}
	.slot:hover{
		background-color: #f8f9fa;
		transform: translateY(-2px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
		border-color: #e5e7eb;
		color: #1a1a1a;
		z-index: 10;
	}
	.day:hover {
		background-color: #f8f9fa;
		transform: translateY(-2px);
		box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
		border-color: #e5e7eb;
		color: #1a1a1a;
		z-index: 10;
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
	.selectedDay {
		border: 2px solid #fbc400;
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
	.logo {
		width: 2rem;
		height: 2rem;
	}

	/* 确保页面根元素也不会出现滚动条 */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		width: 100%;
	}

	:global(html) {
		overflow: hidden;
		width: 100%;
	}
</style>
