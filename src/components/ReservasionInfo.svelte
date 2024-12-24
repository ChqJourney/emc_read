<script lang="ts">
  import type { Reservation } from '../biz/types';
  
  export let reservation: Reservation;
  console.log(reservation);
  let showDetails = false;
  // 预订状态中文映射
  const formatStatus = (status: string): string => {
      switch (status) {
          case 'normal':
              return '正常';
          case 'cancel':
              return '已取消';
          case 'lock':
              return '已过期';
          default:
              return '未知状态';
      }
  };
  const formatTimeslot = (timeslot: string): string => {
    switch (timeslot) {
        case 'T1':
            return '9:30-12:00';
        case 'T2':
            return '13:00-15:00';
        case 'T3':
            return '15:00-17:30';
        case 'T4':
            return '18:00-20:30';
        case 'T5':
            return '20:30-23:59';
        default:
            return '未知时间段';
    }
  }
const formatTime = (date: Date) => {
  return date.toString().substring(0, 16);
}
</script>

<div class="reservation-info">
  <h3>预订详情</h3>
  <a class="link" href="#" on:click={()=>showDetails = !showDetails}>详情</a>
  <div class="info-grid">
    <div class="info-item">
      <span class="label">客户名称：</span>
      <span class="value">{reservation.client_name}</span>
    </div>
    {#if showDetails}
    <div class="info-item">
      <span class="label">产品名称：</span>
      <span class="value">{reservation.product_name}</span>
    </div>
    <div class="info-item">
      <span class="label">联系人：</span>
      <span class="value">{reservation.contact_name}</span>
    </div>
    
    <div class="info-item">
      <span class="label">联系电话：</span>
      <span class="value">{reservation.contact_phone}</span>
    </div>
    <div class="info-item">
      <span class="label">预约日期：</span>
      <span class="value">{reservation.reservation_date}</span>
    </div>
    {/if}
    
    <div class="info-item">
      <span class="label">时间段：</span>
      <span class="value">{formatTimeslot(reservation.time_slot)}</span>
    </div>
    <div class="info-item">
      <span class="label">项目号：</span>
      <span class="value">{reservation.job_no}</span>
    </div>
    <div class="info-item">
      <span class="label">项目工程师：</span>
      <span class="value">{reservation.project_engineer}</span>
    </div>
    <div class="info-item">
      <span class="label">测试工程师：</span>
      <span class="value">{reservation.testing_engineer}</span>
    </div>
    <div class="info-item">
      <span class="label">测试：</span>
      <span class="value">{reservation.tests}</span>
    </div>
    
    <div class="info-item">
      <span class="label">负责销售：</span>
      <span class="value">{reservation.sales}</span>
    </div>
       {#if showDetails}
    <div class="info-item">
      <span class="label">创建：</span>
      <span class="value">{reservation.reservate_by}</span>
    </div>
    <div class="info-item">
      <span class="label">创建时间：</span>
      <span class="value">{formatTime(reservation.created_On)}</span>
    </div>
    <div class="info-item">
      <span class="label">修改时间：</span>
      <span class="value">{formatTime(reservation.updated_On)}</span>
    </div>
    <div class="info-item">
      <span class="label">预订状态：</span>
      <span class="value status" class:cancelled={reservation.reservation_status === 'cancel'}>
        {formatStatus(reservation.reservation_status)}
      </span>
    </div>
    
    <div class="info-item purpose">
      <span class="label">用途描述：</span>
      <span class="value">{reservation.purpose_description}</span>
    </div>
    {/if}
  </div>
</div>

<style>
  .reservation-info {
    padding: 2rem;
    color: #2c3e50;
    position: relative;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .reservation-info:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  h3 {
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 500;
    color: #1a202c;
  }

  .link {
    position: absolute;
    right: 2rem;
    top: 2rem;
    color: #4a5568;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
  }

  .link:hover {
    background: #edf2f7;
    color: #2d3748;
    transform: translateY(-1px);
  }

  .info-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .info-item {
    display: flex;
    align-items: flex-start;
    padding: 0.75rem;
    border-radius: 8px;
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  .info-item:hover {
    background: #f1f5f9;
    transform: translateX(2px);
  }

  .label {
    color: #64748b;
    font-size: 0.9rem;
    min-width: 90px;
    padding-right: 1rem;
  }

  .value {
    color: #334155;
    font-size: 0.95rem;
    word-break: break-word;
  }

  .value.status {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.9rem;
    background: #e2e8f0;
  }

  .status.cancelled {
    color: #dc2626;
    background: #fee2e2;
  }

  .purpose {
    grid-column: 1 / -1;
  }

  .purpose .value {
    white-space: pre-wrap;
  }
</style>