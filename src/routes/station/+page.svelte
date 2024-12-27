<script lang="ts">
	import type { PageData } from "./[slug]/$types";
	import { get, writable } from "svelte/store";
	import { goto } from "$app/navigation";
	import { calendar } from "../../biz/calendar";
	import type {
		Reservation,
		ReservationDTO,
		Station,
	} from "../../biz/types";
	import { onMount } from "svelte";
	import { repository } from "../../biz/database";
    import { modalStore } from "../../components/modalStore";
	import ReservationInfo from "../../components/ReservationInfo.svelte";
    import { load } from "@tauri-apps/plugin-store";
    import ReservasionInfo from "../../components/ReservationInfo.svelte";

	let { data }: { data: PageData } = $props();
	let { stationId }: { stationId: string } = data;
	console.log(stationId);
	// 使用calendar实例的store
	const currentMonth = calendar.currentMonth;
	let selectedDate = writable("");
	// 加载月度预约数据
	async function loadMonthData(): Promise<Reservation[]> {
		// 获取整月的预约数据
		const res = await repository.getReservationsByStationAndMonth($currentMonth,parseInt(stationId));
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
	onMount(async () => {
		const store=await load("store.json");
		let u:{machine:string,user:string}|undefined=await store.get("user");
		if(u?.machine&&u?.user){
			await logVisiting({visit_machine:u.machine,visit_user:u.user});
		}
	});
	async function loadStationInfo(stationId: string): Promise<Station> {
		console.log(stationId);
		const stationInfos: Station[] = await repository.getStationById(
			parseInt(stationId),
		);
		console.log(stationInfos);
		return stationInfos[0];
	}
	

	

	let loadingIndicator = 0;
	const handleSubmit = async (reservationDTO:ReservationDTO) => {
		// TODO: 处理表单提交
		reservationDTO.reservate_by = "Patrick Chen";
		let reservations = await repository.getReservationsByStationAndTime(
			get(calendar.selectedDate),
			reservationDTO.station_id,
			reservationDTO.time_slot,
		);
		if (reservations.length > 0) {
			modalStore.close();
			alert("该工位该时间段已有预约");
			return;
		} else {
			await repository.createReservation(
				reservationDTO as Reservation,
			);
			loadingIndicator++;
		}
	};
</script>

<div class="container">
	<!-- 固定的顶部信息 -->
	<header class="station-info">
		<div class="header-content">
			<img src="/intertek.png" class="brand" alt="logo" />
			{#await loadStationInfo(stationId)}
				<div class="loading-spinner">加载中...</div>
			{:then stationInfo}
				{#if stationInfo}
					<div class="station-details">
						<div class="station-name-container">
							<h3 class="station-name">
								{stationInfo.name ?? "Unknown"}
							</h3>
							<p class="station-description">
								{stationInfo.description ?? "Unknown"}
							</p>
						</div>
						<img
							src={stationInfo.photo_path}
							class="station-image"
							alt="station_pic"
						/>
					</div>
				{/if}
			{/await}
			<button
				aria-label="home"
				class="tooltip-container"
				onclick={() => goto(`/date?${$selectedDate}`)}
			>
				<span class="tooltip">返回工位列表</span>
				<svg
                    style="fill: #fbc400;width:1.5rem;height:1.5rem;"
					viewBox="0 0 1024 1024"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					width="200"
					height="200"
					><path
						d="M853.333333 1024 170.666667 1024c-93.866667 0-170.666667-76.8-170.666667-170.666667L0 213.333333c0-25.6 17.066667-42.666667 42.666667-42.666667l938.666667 0c25.6 0 42.666667 17.066667 42.666667 42.666667l0 640C1024 947.2 947.2 1024 853.333333 1024zM85.333333 256l0 597.333333c0 46.933333 38.4 85.333333 85.333333 85.333333l682.666667 0c46.933333 0 85.333333-38.4 85.333333-85.333333L938.666667 256 85.333333 256z"
					></path><path d="M512 256"></path><path
						d="M981.333333 213.333333 42.666667 213.333333 42.666667 170.666667c0-72.533333 55.466667-128 128-128l682.666667 0c72.533333 0 128 55.466667 128 128L981.333333 213.333333z"
					></path><path
						d="M981.333333 256 42.666667 256C17.066667 256 0 238.933333 0 213.333333L0 170.666667c0-93.866667 76.8-170.666667 170.666667-170.666667l682.666667 0c93.866667 0 170.666667 76.8 170.666667 170.666667l0 42.666667C1024 238.933333 1006.933333 256 981.333333 256zM85.333333 170.666667l853.333333 0c0-46.933333-38.4-85.333333-85.333333-85.333333L170.666667 85.333333C123.733333 85.333333 85.333333 123.733333 85.333333 170.666667z"
					></path><path
						d="M298.666667 1024c-25.6 0-42.666667-17.066667-42.666667-42.666667L256 213.333333c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666667 42.666667l0 768C341.333333 1006.933333 324.266667 1024 298.666667 1024z"
					></path><path d="M42.666667 341.333333"></path><path
						d="M981.333333 341.333333"
					></path><path
						d="M981.333333 512 42.666667 512c-25.6 0-42.666667-17.066667-42.666667-42.666667s17.066667-42.666667 42.666667-42.666667l938.666667 0c25.6 0 42.666667 17.066667 42.666667 42.666667S1006.933333 512 981.333333 512z"
					></path><path
						d="M981.333333 768 42.666667 768c-25.6 0-42.666667-17.066667-42.666667-42.666667s17.066667-42.666667 42.666667-42.666667l938.666667 0c25.6 0 42.666667 17.066667 42.666667 42.666667S1006.933333 768 981.333333 768z"
					></path></svg
				>
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
						style="fill: #94a3b8;"
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
						style="fill: #94a3b8;"
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
							<div onclick={async () => {
								selectedDate.set(date);
								if(reservations.filter(f=>f.time_slot==="T1").length>0){
									modalStore.open(ReservasionInfo,{
										onNegative:()=>modalStore.close(),
										reservation:reservations.filter(f=>f.time_slot==="T1")[0]
									});
								}
							}} class="slot tooltip-container" class:fill_slot={reservations.filter(f=>f.time_slot==="T1").length>0}>{#if reservations.filter(f=>f.time_slot==="T1").length>0}<span class="tooltip">{reservations.filter(f=>f.time_slot==="T1")[0]?.client_name}</span>{/if}</div>
							<div onclick={async () => {
								selectedDate.set(date);
								if(reservations.filter(f=>f.time_slot==="T2").length>0){
									    modalStore.open(ReservasionInfo,{
										onNegative:()=>modalStore.close(),
										reservation:reservations.filter(f=>f.time_slot==="T2")[0]
									});
								}
							}} class="slot tooltip-container" class:fill_slot={reservations.filter(f=>f.time_slot==="T2").length>0}>{#if reservations.filter(f=>f.time_slot==="T2").length>0}<span class="tooltip">{reservations.filter(f=>f.time_slot==="T2")[0]?.client_name}</span>{/if}</div>
							<div onclick={async () => {
								selectedDate.set(date);
								if(reservations.filter(f=>f.time_slot==="T3").length>0){
									modalStore.open(ReservasionInfo,{
										onNegative:()=>modalStore.close(),
										reservation:reservations.filter(f=>f.time_slot==="T3")[0]
									});
								}
							}} class="slot tooltip-container" class:fill_slot={reservations.filter(f=>f.time_slot==="T3").length>0}>{#if reservations.filter(f=>f.time_slot==="T3").length>0}<span class="tooltip">{reservations.filter(f=>f.time_slot==="T3")[0]?.client_name}</span>{/if}</div>
							<div onclick={async () => {
								selectedDate.set(date);
								if(reservations.filter(f=>f.time_slot==="T4").length>0){
									modalStore.open(ReservasionInfo,{
										onNegative:()=>modalStore.close(),
										reservation:reservations.filter(f=>f.time_slot==="T4")[0]
									});
								}
							}} class="slot tooltip-container" class:fill_slot={reservations.filter(f=>f.time_slot==="T4").length>0}>{#if reservations.filter(f=>f.time_slot==="T4").length>0}<span class="tooltip">{reservations.filter(f=>f.time_slot==="T4")[0]?.client_name}</span>{/if}</div>
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
	
	.station-info {
		background: white;
		width: 100%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-radius: 12px;
		transition: all 0.3s ease;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 1rem;
		box-sizing: border-box; /* 确保padding计入总宽度 */
	}
	.station-info button {
		background: none;
		border: 1px solid #e0e0e0;
		padding: 6px 8px;
		border-radius: 6px;
		color: #666;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.station-info button:hover {
		background-color: #f0f0f0;
		color: #333;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	.logo {
		height: 30px;
		width: 30px;
		margin: 15px;
	}
	.brand {
		height: 4rem;
		width: 4rem;
		border-radius: 0.6rem;
	}
	.station-info .header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		box-sizing: border-box;
		padding: 0.5rem 0;
	}

	.station-details {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		margin: 0 1rem;
	}
	.station-image {
		width: 100px;
		height: 100px;
		border-radius: 12px;
		margin-right: 4rem;
	}

	.calendar-container {
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden; /* 防止出现滚动条 */
		height: calc(100vh - 80px); /* 减去顶部导航的高度 */
	}
	.tooltip-container {
		position: relative;
	}

	.tooltip-container .tooltip {
		position: absolute;
		left: 0;
		bottom: 100%;
		transform: translateY(-10px);
		margin-bottom: 10px;
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 100;
	}

	/* 调整小三角形的位置 */
	.tooltip-container .tooltip::before {
		content: "";
		position: absolute;
		top: 100%;
		left: 20px;
		transform: rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
		margin-top: -4px;
	}

	.tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
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
	.calendar {
		width: min(95vw, 800px); /* 日历最大宽度限制 */
		aspect-ratio: 7/6; /* 保持日历的宽高比 */
		max-height: 95%;
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
		min-height: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		margin:  2px 0;
		text-align: center;
		opacity: 0.8;
	}
	.fill_slot{
		background-color: #bc42b0;
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
		border: 2px solid #d8cd2e;
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

	/* 原有的 tooltip 样式改名为 nav-tooltip */
	.tooltip-container .tooltip {
		position: absolute;
		right: 10%;
		top: -30px;
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
		z-index: 100;
	}

	/* 为 slot 添加专门的 tooltip 样式 */
	.slot.tooltip-container .tooltip {
		right: auto;
		left: 100%;
		top: 50%;
		transform: translateY(-50%) translateX(10px);
		margin-left: 5px;
	}

	/* 修改 slot tooltip 的小三角形位置 */
	.slot.tooltip-container .tooltip::before {
		content: "";
		position: absolute;
		left: -4px;
		top: 50%;
		transform: translateY(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
	}

	/* slot tooltip 的悬停效果 */
	.slot.tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) translateX(0);
	}

	/* 基础 tooltip 样式 */
	.tooltip-container .tooltip {
		position: absolute;
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.85rem;
		white-space: nowrap;
		opacity: 0;
		visibility: hidden;
		transition: all 0.3s ease;
		z-index: 100;
	}

	/* 顶部导航按钮的 tooltip */
	.header-content .tooltip-container .tooltip {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%) translateY(10px);
		margin-bottom: 10px;
	}

	.header-content .tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateX(-50%) translateY(0);
	}

	.header-content .tooltip-container .tooltip::before {
		content: "";
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
		margin-top: -4px;
	}

	/* 日历 slot 的 tooltip */
	.slot.tooltip-container .tooltip {
		left: 105%;
		top: 50%;
		transform: translateY(-50%) translateX(5px);
	}

	.slot.tooltip-container:hover .tooltip {
		opacity: 1;
		visibility: visible;
		transform: translateY(-50%) translateX(0);
	}

	.slot.tooltip-container .tooltip::before {
		content: "";
		position: absolute;
		left: -4px;
		top: 50%;
		transform: translateY(-50%) rotate(45deg);
		width: 8px;
		height: 8px;
		background-color: rgba(0, 0, 0, 0.8);
	}
</style>
