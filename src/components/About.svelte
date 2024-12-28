<script lang="ts">
  import { modalStore } from './modalStore';
  let { onNegative } = $props();
</script>

<div class="about-container">
  <h3>关于 EMC 预约系统</h3>
  
  <div class="content">
    <p class="version">版本：v20241228</p>
    
    <div class="section">
      <h4>系统说明</h4>
      <p>EMC 预约系统是专门为 Intertek Zhejiang EMC实验室开发的预约管理系统。本系统用于查看和管理预约信息。</p>
    </div>

    <div class="section">
      <h4>功能特点</h4>
      <div class="features">
        <ul>
          <li>高度可视化界面</li>
          <li>支持按工位查看预约</li>
          <li>支持按日期查看预约</li>
          <li>预约信息详情展示</li>
          <li style="color: orange;">支持预约创建、修改、删除</li>
          <li style="color: orange;">支持工位创建、修改、删除</li>
          <li style="color: orange;">支持测试内容自定义</li>
          <li style="color: orange;">支持人员自定义</li>
          <li style="color: orange;">支持访问记录查询</li>
        </ul>
        <div style="padding-left: 3rem;">
            <span style="width: 10px; height: 10px; display: inline-block; background-color: orange;"></span>
            <div style="display: inline-block; color: orange;">仅管理员端含此功能</div>
      </div>
      </div>
    </div>

    <div class="section">
      <h4>技术支持</h4>
      <p>如有任何问题或建议，请联系系统管理员XXXX。</p>
    </div>
  </div>

  <footer class="copyright">
   
    <p> {new Date().getFullYear()} Intertek Zhejiang EMC Department</p>
    <p class="rights">All Rights Reserved</p>
  </footer>

</div>

<style>
  .about-container {
    color: #333;
    padding: 1rem 0rem;
    overflow: hidden;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 500px;
    margin: 0 auto;
  }

  h3 {
    color: #fbc400;
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .content {
    margin-bottom: 0.6rem;
  }

  .version {
    color: #666;
    text-align: center;
    font-size: 0.9rem;
  }

  .section {
    margin-bottom: 0.4rem;
    background: #fff;
    padding: 0.2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  h4 {
    color: #444;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .features {
    margin-bottom: 0.4rem;
    max-height: 150px;
    overflow-y: auto;
    padding-right: 10px;
  }

  .features::-webkit-scrollbar {
    width: 6px;
  }

  .features::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .features::-webkit-scrollbar-thumb {
    background: #fbc400;
    border-radius: 3px;
  }

  ul {
    list-style-type: none;
    margin-left: 0.5rem;
  }

  li {
    margin-bottom: 0.8rem;
    position: relative;
    padding-left: 1.5rem;
  }

  li:before {
    content: "•";
    color: #fbc400;
    font-weight: bold;
    position: absolute;
    left: 0;
  }

  .copyright {
    text-align: center;
    color: #666;
    font-size: 0.8rem;
    margin-top: 1rem;
  }

  .rights {
    color: #999;
    font-size: 0.75rem;
  }

  p {
    line-height: 1.6;
  }
</style>