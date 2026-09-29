<script lang="ts">
 import { Users, Send , CircleUserRound} from '@lucide/svelte';
// import CalendarIcon from "@lucide/svelte/icons/calendar";
 import HouseIcon from "@lucide/svelte/icons/house";
// import InboxIcon from "@lucide/svelte/icons/inbox";
// import SearchIcon from "@lucide/svelte/icons/search";
// import SettingsIcon from "@lucide/svelte/icons/settings";
 import * as Sidebar from "$lib/components/ui/sidebar/index.js";
 
 const items = [
  {
   title: "Home",
   url: "#",
   icon: HouseIcon,
  },
  {
   title: "Freinds",
   url: "#",
   icon: Users,
  },
  {
   title: "Message",
   url: "#",
   icon: Send,
  },
  {
   title: "Profile",
   url: "#",
   icon: CircleUserRound,
  },
 ];
</script>
 
<Sidebar.Root>
 <Sidebar.Content>
  <Sidebar.Group>
   <Sidebar.GroupLabel>Application</Sidebar.GroupLabel>
   <Sidebar.GroupContent>
    <Sidebar.Menu>
     {#each items as item (item.title)}
      <Sidebar.MenuItem>
       <Sidebar.MenuButton>
        {#snippet child({ props })}
         <a href={item.url} {...props}>
          <item.icon />
          <span>{item.title}</span>
         </a>
        {/snippet}
       </Sidebar.MenuButton>
      </Sidebar.MenuItem>
     {/each}
    </Sidebar.Menu>
   </Sidebar.GroupContent>
  </Sidebar.Group>
 </Sidebar.Content>
</Sidebar.Root>